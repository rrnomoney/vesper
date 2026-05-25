package com.vesper.backend.controller;

import com.vesper.backend.common.Result;
import com.vesper.backend.dto.CreateReviewRequest;
import com.vesper.backend.service.ReviewService;
import com.vesper.backend.vo.ReviewVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/reviews")
    public Result<ReviewVO> createReview(@Valid @RequestBody CreateReviewRequest request) {
        return Result.success(reviewService.createReview(request));
    }

    @GetMapping("/bars/{barId}/reviews")
    public Result<List<ReviewVO>> listBarReviews(@PathVariable Long barId) {
        return Result.success(reviewService.listBarReviews(barId));
    }

    @GetMapping("/users/me/reviews")
    public Result<List<ReviewVO>> listMyReviews() {
        return Result.success(reviewService.listMyReviews());
    }

    @DeleteMapping("/reviews/{id}")
    public Result<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return Result.success();
    }
}
