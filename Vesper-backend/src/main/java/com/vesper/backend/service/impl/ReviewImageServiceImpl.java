package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.entity.ReviewImage;
import com.vesper.backend.mapper.ReviewImageMapper;
import com.vesper.backend.service.ReviewImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewImageServiceImpl implements ReviewImageService {

    private final ReviewImageMapper reviewImageMapper;

    @Override
    @Transactional
    public void saveReviewImages(Long reviewId, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }

        imageUrls.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .limit(3)
                .forEach(imageUrl -> {
                    ReviewImage reviewImage = new ReviewImage();
                    reviewImage.setReviewId(reviewId);
                    reviewImage.setImageUrl(imageUrl);
                    reviewImageMapper.insert(reviewImage);
                });
    }

    @Override
    public Map<Long, List<String>> listImageUrlsByReviewIds(List<Long> reviewIds) {
        if (reviewIds == null || reviewIds.isEmpty()) {
            return Collections.emptyMap();
        }

        return reviewImageMapper.selectList(new LambdaQueryWrapper<ReviewImage>()
                        .in(ReviewImage::getReviewId, reviewIds)
                        .orderByAsc(ReviewImage::getCreatedAt))
                .stream()
                .collect(Collectors.groupingBy(
                        ReviewImage::getReviewId,
                        Collectors.mapping(ReviewImage::getImageUrl, Collectors.toList())
                ));
    }

    @Override
    @Transactional
    public void deleteByReviewId(Long reviewId) {
        reviewImageMapper.delete(new LambdaQueryWrapper<ReviewImage>()
                .eq(ReviewImage::getReviewId, reviewId));
    }
}
