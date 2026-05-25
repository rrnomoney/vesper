package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.dto.CreateReviewRequest;
import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Review;
import com.vesper.backend.entity.User;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.BarMapper;
import com.vesper.backend.mapper.ReviewMapper;
import com.vesper.backend.mapper.UserMapper;
import com.vesper.backend.service.ReviewImageService;
import com.vesper.backend.service.ReviewService;
import com.vesper.backend.vo.ReviewVO;
import com.vesper.backend.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewMapper reviewMapper;
    private final BarMapper barMapper;
    private final UserMapper userMapper;
    private final ReviewImageService reviewImageService;

    @Override
    @Transactional
    public ReviewVO createReview(CreateReviewRequest request) {
        Long userId = currentUserId();
        Bar bar = ensureBarExists(request.getBarId());
        String content = request.getContent().trim();
        if (!StringUtils.hasText(content)) {
            throw new BusinessException(400, "Review content cannot be empty");
        }

        Review review = new Review();
        review.setUserId(userId);
        review.setBarId(request.getBarId());
        review.setRating(request.getRating());
        review.setContent(content);
        reviewMapper.insert(review);
        List<String> imageUrls = sanitizeImageUrls(request.getImageUrls());
        reviewImageService.saveReviewImages(review.getId(), imageUrls);

        Review savedReview = reviewMapper.selectById(review.getId());
        User user = userMapper.selectById(userId);
        return ReviewVO.from(savedReview, bar, user, imageUrls);
    }

    @Override
    public List<ReviewVO> listBarReviews(Long barId) {
        Bar bar = ensureBarExists(barId);
        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getBarId, barId)
                .orderByDesc(Review::getCreatedAt));
        if (reviews.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, User> users = loadUsers(reviews);
        Map<Long, List<String>> imageUrls = loadImageUrls(reviews);
        return reviews.stream()
                .map(review -> ReviewVO.from(review, bar, users.get(review.getUserId()), imageUrls.get(review.getId())))
                .toList();
    }

    @Override
    public List<ReviewVO> listMyReviews() {
        Long userId = currentUserId();
        List<Review> reviews = reviewMapper.selectList(new LambdaQueryWrapper<Review>()
                .eq(Review::getUserId, userId)
                .orderByDesc(Review::getCreatedAt));
        if (reviews.isEmpty()) {
            return Collections.emptyList();
        }

        User user = userMapper.selectById(userId);
        Map<Long, Bar> bars = loadBars(reviews);
        Map<Long, List<String>> imageUrls = loadImageUrls(reviews);
        return reviews.stream()
                .map(review -> ReviewVO.from(review, bars.get(review.getBarId()), user, imageUrls.get(review.getId())))
                .toList();
    }

    @Override
    @Transactional
    public void deleteReview(Long id) {
        Long userId = currentUserId();
        Review review = reviewMapper.selectById(id);
        if (review == null) {
            throw new BusinessException(404, "Review does not exist");
        }

        if (!userId.equals(review.getUserId())) {
            throw new BusinessException(403, "You can only delete your own review");
        }

        reviewImageService.deleteByReviewId(id);
        reviewMapper.deleteById(id);
        // TODO: Delete local image files when object storage or file lifecycle management is added.
    }

    private Bar ensureBarExists(Long barId) {
        Bar bar = barMapper.selectById(barId);
        if (bar == null) {
            throw new BusinessException(400, "Bar does not exist");
        }
        return bar;
    }

    private Map<Long, User> loadUsers(List<Review> reviews) {
        List<Long> userIds = reviews.stream()
                .map(Review::getUserId)
                .distinct()
                .toList();
        return userMapper.selectBatchIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private Map<Long, Bar> loadBars(List<Review> reviews) {
        List<Long> barIds = reviews.stream()
                .map(Review::getBarId)
                .distinct()
                .toList();
        return barMapper.selectBatchIds(barIds).stream()
                .collect(Collectors.toMap(Bar::getId, Function.identity()));
    }

    private Map<Long, List<String>> loadImageUrls(List<Review> reviews) {
        List<Long> reviewIds = reviews.stream()
                .map(Review::getId)
                .distinct()
                .toList();
        return reviewImageService.listImageUrlsByReviewIds(reviewIds);
    }

    private List<String> sanitizeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> sanitized = imageUrls.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
        if (sanitized.size() > 3) {
            throw new BusinessException(400, "A review can include up to 3 images");
        }
        return sanitized;
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserVO user)) {
            throw new BusinessException(401, "Unauthorized");
        }
        return user.getId();
    }
}
