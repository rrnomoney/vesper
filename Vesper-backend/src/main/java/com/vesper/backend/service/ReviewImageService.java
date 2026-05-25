package com.vesper.backend.service;

import java.util.List;
import java.util.Map;

public interface ReviewImageService {

    void saveReviewImages(Long reviewId, List<String> imageUrls);

    Map<Long, List<String>> listImageUrlsByReviewIds(List<Long> reviewIds);

    void deleteByReviewId(Long reviewId);
}
