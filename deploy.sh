#!/bin/bash
set -e

APP_DIR="/opt/app"
BACKEND_PORT=8080
FRONTEND_PORT=3000
PROJECT_DIR=$(pwd)

echo "=============================="
echo " Starting Deployment"
echo "=============================="

# 1. Update System
sudo apt update -y

# 2. Java 21
if ! java -version 2>&1 | grep -q "21"; then
    echo "Installing Java 21..."
    wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
        | sudo apt-key add -
    echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" \
        | sudo tee /etc/apt/sources.list.d/adoptium.list
    sudo apt update -y && sudo apt install -y temurin-21-jdk
fi
echo "Java version: $(java -version 2>&1 | head -1)"

# 3. PostgreSQL 15
if ! psql --version 2>&1 | grep -q "15"; then
    echo "Installing PostgreSQL 15..."
    sudo apt install -y postgresql-15
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
fi
echo "PostgreSQL: OK"

# 4. Elasticsearch 8
if ! systemctl is-active --quiet elasticsearch; then
    echo "Installing Elasticsearch 8..."
    wget -qO - https://artifacts.elastic.co/GPG-KEY-elasticsearch \
        | sudo gpg --dearmor -o /usr/share/keyrings/elasticsearch-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/elasticsearch-keyring.gpg] \
        https://artifacts.elastic.co/packages/8.x/apt stable main" \
        | sudo tee /etc/apt/sources.list.d/elastic-8.x.list
    sudo apt update -y && sudo apt install -y elasticsearch
    sudo sed -i 's/xpack.security.enabled: true/xpack.security.enabled: false/' \
        /etc/elasticsearch/elasticsearch.yml
    sudo systemctl enable elasticsearch
    sudo systemctl start elasticsearch
fi
echo "Elasticsearch: OK"

# 5. Node.js 20
if ! node -v 2>&1 | grep -q "v20"; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node: $(node -v)"

# 6. PM2
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "PM2: OK"

# 7. App Directory
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 8. Build Backend
echo "Building Backend..."
cd $PROJECT_DIR
chmod +x mvnw
./mvnw clean package -DskipTests
cp target/*.jar $APP_DIR/app.jar
echo "Backend build: OK"

# 9. Build Frontend
echo "Building Frontend..."
cd $PROJECT_DIR/blacklist-ui/blacklist-ui
npm install
npm run build
echo "Frontend build: OK"

# 10. Backend systemd Service
sudo tee /etc/systemd/system/aml-backend.service > /dev/null <<EOF
[Unit]
Description=AML Backend
After=network.target postgresql.service elasticsearch.service

[Service]
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/java -jar $APP_DIR/app.jar
Restart=always
RestartSec=10
StandardOutput=append:/var/log/aml-backend.log
StandardError=append:/var/log/aml-backend.log

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable aml-backend
sudo systemctl restart aml-backend
echo "Backend service: OK"

# 11. Frontend via PM2
cd $PROJECT_DIR/blacklist-ui/blacklist-ui
pm2 delete aml-frontend 2>/dev/null || true
pm2 start npm --name "aml-frontend" -- start -- -p $FRONTEND_PORT
pm2 save
pm2 startup | tail -1 | sudo bash
echo "Frontend service: OK"

# 12. Nginx
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/aml > /dev/null <<EOF
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_read_timeout 60s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/aml /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
echo "Nginx: OK"

echo ""
echo "=============================="
echo " Deployment Complete"
echo " URL: http://$(hostname -I | awk '{print $1}')"
echo " Backend logs: tail -f /var/log/aml-backend.log"
echo " Frontend logs: pm2 logs aml-frontend"
echo "=============================="
