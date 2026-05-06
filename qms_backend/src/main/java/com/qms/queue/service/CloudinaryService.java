package com.qms.queue.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.qms.queue.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    /**
     * Uploads a photo file to Cloudinary under the "qms/photos" folder.
     * Only JPG/JPEG files are accepted. Stored and served as JPG.
     *
     * @param file the photo file (JPG/JPEG only)
     * @return the secure URL of the uploaded JPG image
     */
    @SuppressWarnings("unchecked")
    public String uploadPhoto(MultipartFile file) {
        validatePhotoFile(file);
        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder",          "qms/photos",
                    "resource_type",   "image",
                    "format",          "jpg",
                    "use_filename",    true,
                    "unique_filename", true
            );
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String url = (String) result.get("secure_url");
            log.info("Photo uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary photo upload failed", e);
            throw new BusinessException("Failed to upload photo. Please try again.");
        }
    }

    private void validatePhotoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Photo file is empty.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BusinessException("Invalid photo file.");
        }
        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg")) {
            throw new BusinessException("Only JPG/JPEG photo files are accepted.");
        }
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equalsIgnoreCase("image/jpeg") && !contentType.equalsIgnoreCase("image/jpg"))) {
            throw new BusinessException("Only JPG/JPEG photo files are accepted.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new BusinessException("Photo file size must not exceed 10 MB.");
        }
    }

    /**
     * Uploads a resume file to Cloudinary under the "qms/resumes" folder.
     * Only PDF files are accepted.
     *
     * @param file the resume file (PDF only)
     * @return the secure URL of the uploaded file
     */
    @SuppressWarnings("unchecked")
    public String uploadResume(MultipartFile file) {
        validateResumeFile(file);
        try {
            Map<String, Object> uploadParams = ObjectUtils.asMap(
                    "folder",        "qms/resumes",
                    "resource_type", "raw",
                    "format",        "pdf",
                    "use_filename",  true,
                    "unique_filename", true
            );
            Map<String, Object> result = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String url = (String) result.get("secure_url");
            log.info("Resume uploaded to Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            log.error("Cloudinary upload failed", e);
            throw new BusinessException("Failed to upload resume. Please try again.");
        }
    }

    private void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Resume file is empty.");
        }
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BusinessException("Invalid resume file.");
        }
        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".pdf")) {
            throw new BusinessException("Only PDF resume files are accepted.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf")) {
            throw new BusinessException("Only PDF resume files are accepted.");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new BusinessException("Resume file size must not exceed 10 MB.");
        }
    }
}
