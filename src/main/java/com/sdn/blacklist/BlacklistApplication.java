// package com.sdn.blacklist;

// import org.springframework.boot.SpringApplication;
// import org.springframework.boot.autoconfigure.SpringBootApplication;
// import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling
// @SpringBootApplication
// public class BlacklistApplication {

//     public static void main(String[] args) {
//         SpringApplication.run(BlacklistApplication.class, args);

//     }

// }

package com.sdn.blacklist;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
// 1. Tell Spring exactly where your Postgres repositories are
@EnableJpaRepositories(basePackages = "com.sdn.blacklist.repository") 
// 2. Tell Spring exactly where your Elasticsearch repositories are (if you have them)
@EnableElasticsearchRepositories(basePackages = "com.sdn.blacklist.search.repository") 
public class BlacklistApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlacklistApplication.class, args);
    }
}
