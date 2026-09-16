package com.alight.marketplace.modules.media.controller;

import com.alight.marketplace.common.response.ApiResponse;
import com.alight.marketplace.modules.media.dto.MediaUploadResponse;
import com.alight.marketplace.modules.media.service.MediaStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media & File Upload", description = "Endpoints for uploading images, product photos, brand logos, and documents")
public class MediaUploadController {

    private final MediaStorageService mediaStorageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload single image or document")
    public ResponseEntity<ApiResponse<MediaUploadResponse>> uploadSingleFile(
            @RequestParam("file") MultipartFile file
    ) {
        MediaUploadResponse res = mediaStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success(res, "File uploaded successfully"));
    }

    @PostMapping(value = "/upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple images or documents")
    public ResponseEntity<ApiResponse<List<MediaUploadResponse>>> uploadMultipleFiles(
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<MediaUploadResponse> res = mediaStorageService.storeFiles(files);
        return ResponseEntity.ok(ApiResponse.success(res, "Files uploaded successfully"));
    }
}
