package com.alight.marketplace.modules.media.service.impl;

import com.alight.marketplace.common.exception.BadRequestException;
import com.alight.marketplace.modules.media.dto.MediaUploadResponse;
import com.alight.marketplace.modules.media.service.MediaStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class LocalStorageServiceImpl implements MediaStorageService {

    @Value("${app.media.upload-dir:uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "svg", "pdf"
    );

    private Path rootLocation;

    @PostConstruct
    public void init() {
        try {
            rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("Initialized media storage directory at: {}", rootLocation);
        } catch (IOException e) {
            log.error("Could not initialize media storage directory", e);
            throw new RuntimeException("Could not initialize media storage folder", e);
        }
    }

    @Override
    public MediaUploadResponse storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg");
        String extension = "";
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx >= 0) {
            extension = originalFilename.substring(dotIdx + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("File type ." + extension + " is not allowed. Allowed: " + ALLOWED_EXTENSIONS);
        }

        String uniqueFileName = UUID.randomUUID().toString() + "." + extension;
        Path destination = rootLocation.resolve(uniqueFileName).normalize().toAbsolutePath();

        if (!destination.getParent().equals(rootLocation)) {
            throw new BadRequestException("Cannot store file outside current directory.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored file: {} as {}", originalFilename, uniqueFileName);

            String fileUrl = "/uploads/" + uniqueFileName;

            return MediaUploadResponse.builder()
                    .url(fileUrl)
                    .originalFileName(originalFilename)
                    .storedFileName(uniqueFileName)
                    .contentType(file.getContentType())
                    .sizeBytes(file.getSize())
                    .build();
        } catch (IOException e) {
            log.error("Failed to store file: {}", originalFilename, e);
            throw new RuntimeException("Failed to store file " + originalFilename, e);
        }
    }

    @Override
    public List<MediaUploadResponse> storeFiles(List<MultipartFile> files) {
        List<MediaUploadResponse> list = new ArrayList<>();
        for (MultipartFile f : files) {
            if (!f.isEmpty()) {
                list.add(storeFile(f));
            }
        }
        return list;
    }
}
