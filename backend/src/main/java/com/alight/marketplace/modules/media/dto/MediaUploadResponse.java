package com.alight.marketplace.modules.media.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaUploadResponse {
    private String url;
    private String originalFileName;
    private String storedFileName;
    private String contentType;
    private long sizeBytes;
}
