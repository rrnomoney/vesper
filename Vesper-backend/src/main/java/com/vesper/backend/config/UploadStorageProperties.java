package com.vesper.backend.config;

import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

@Component
public class UploadStorageProperties {

    private final Path uploadPath;

    public UploadStorageProperties() {
        this.uploadPath = resolveUploadPath();
    }

    public Path getUploadPath() {
        return uploadPath;
    }

    private Path resolveUploadPath() {
        Path workingDirectory = Path.of(System.getProperty("user.dir")).toAbsolutePath().normalize();
        if (Files.exists(workingDirectory.resolve("pom.xml"))) {
            return workingDirectory.resolve("uploads").normalize();
        }

        Path backendDirectory = workingDirectory.resolve("Vesper-backend").normalize();
        if (Files.exists(backendDirectory.resolve("pom.xml"))) {
            return backendDirectory.resolve("uploads").normalize();
        }

        return workingDirectory.resolve("uploads").normalize();
    }
}
