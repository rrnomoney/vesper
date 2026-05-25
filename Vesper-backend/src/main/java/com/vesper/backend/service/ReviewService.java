package com.vesper.backend.service;

import com.vesper.backend.dto.CreateReviewRequest;
import com.vesper.backend.vo.ReviewVO;

import java.util.List;

public interface ReviewService {

    ReviewVO createReview(CreateReviewRequest request);

    List<ReviewVO> listBarReviews(Long barId);

    List<ReviewVO> listMyReviews();

    void deleteReview(Long id);
}
