package com.vesper.backend.vo;

import com.vesper.backend.entity.Bar;
import com.vesper.backend.entity.Review;
import com.vesper.backend.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Data
public class ReviewVO {

    private Long id;

    private Long barId;

    private String barName;

    private Long userId;

    private String username;

    private Integer rating;

    private String content;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<String> imageUrls = Collections.emptyList();

    public static ReviewVO from(Review review, Bar bar, User user) {
        return from(review, bar, user, Collections.emptyList());
    }

    public static ReviewVO from(Review review, Bar bar, User user, List<String> imageUrls) {
        ReviewVO vo = new ReviewVO();
        vo.setId(review.getId());
        vo.setBarId(review.getBarId());
        vo.setBarName(bar == null ? null : bar.getName());
        vo.setUserId(review.getUserId());
        vo.setUsername(user == null ? null : user.getUsername());
        vo.setRating(review.getRating());
        vo.setContent(review.getContent());
        vo.setCreatedAt(review.getCreatedAt());
        vo.setUpdatedAt(review.getUpdatedAt());
        vo.setImageUrls(imageUrls == null ? Collections.emptyList() : imageUrls);
        return vo;
    }
}
