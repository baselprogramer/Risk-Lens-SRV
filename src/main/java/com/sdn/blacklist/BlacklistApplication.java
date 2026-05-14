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
import org.springframework.data.jpa.repository.config.EnableJpaRepositories; // Add this
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.sdn.blacklist") // This tells Spring to find TenantRepository
public class BlacklistApplication {

    public static void main(String[] args) {
        SpringApplication.run(BlacklistApplication.class, args);
    }
}