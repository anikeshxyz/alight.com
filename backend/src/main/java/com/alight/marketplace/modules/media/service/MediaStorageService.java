package com.alight.marketplace.modules.media.service;

import com.alight.marketplace.modules.media.dto.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MediaStorageService {
    MediaUploadResponse storeFile(MultipartFile file);
    List<MediaUploadResponse> storeFiles(List<MultipartFile> files);
}
