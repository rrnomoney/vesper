package com.vesper.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final UploadStorageProperties uploadStorageProperties;

    public WebMvcConfig(UploadStorageProperties uploadStorageProperties) {
        this.uploadStorageProperties = uploadStorageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadStorageProperties.getUploadPath().toUri().toString() + "/");
    }
}
