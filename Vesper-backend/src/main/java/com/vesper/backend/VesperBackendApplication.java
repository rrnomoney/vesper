package com.vesper.backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.vesper.backend.mapper")
@SpringBootApplication
public class VesperBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(VesperBackendApplication.class, args);
    }
}
