APP_DIR="/var/www/risk-lens"
SERVICE_NAME="aml-backend.service" 

echo "------------------------------------------"
echo "🚀 Starting Rebuild Process..."
echo "------------------------------------------"


cd $APP_DIR || exit


echo "📦 Building JAR file..."
sudo rm -rf target/
./mvnw clean package -DskipTests


if [ $? -eq 0 ]; then
    echo "✅ Build Successful!"
    
   
    echo "🔄 Restarting Service: $SERVICE_NAME"
    sudo systemctl restart $SERVICE_NAME
    
    echo "✨ Process Completed Successfully!"
    echo "------------------------------------------"

    sudo systemctl status $SERVICE_NAME --no-pager
else
    echo "❌ Build Failed! Please check the errors above."
    exit 1
fi
