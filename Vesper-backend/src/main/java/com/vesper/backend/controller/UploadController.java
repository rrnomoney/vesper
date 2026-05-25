package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.config.UploadStorageProperties;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.vo.UploadVO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UploadController {

    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024;
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE,
            "image/jpg",
            "image/webp"
    );
    private final UploadStorageProperties uploadStorageProperties;

    @PostMapping(value = "/upload/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Result<UploadVO> uploadImage(@RequestPart("file") MultipartFile file) {
        validateImage(file);

        try {
            Path uploadPath = uploadStorageProperties.getUploadPath();
            Files.createDirectories(uploadPath);
            String extension = getExtension(file.getOriginalFilename());
            String filename = UUID.randomUUID() + "." + extension;
            Path target = uploadPath.resolve(filename).normalize();
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return Result.success(new UploadVO("/uploads/" + filename));
        } catch (IOException exception) {
            throw new BusinessException(500, "Unable to upload image");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(400, "Image file is required");
        }

        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new BusinessException(400, "Image must be 10MB or smaller");
        }

        String contentType = file.getContentType();
        String extension = getExtension(file.getOriginalFilename());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType) || !ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BusinessException(400, "Only jpg, jpeg, png, and webp images are allowed");
        }
    }

    private String getExtension(String filename) {
        String cleanFilename = StringUtils.cleanPath(filename == null ? "" : filename);
        int extensionIndex = cleanFilename.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == cleanFilename.length() - 1) {
            return "";
        }
        return cleanFilename.substring(extensionIndex + 1).toLowerCase(Locale.ROOT);
    }
}
