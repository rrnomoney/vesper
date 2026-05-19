package com.vesper.backend.service;

import com.vesper.backend.dto.LoginRequest;
import com.vesper.backend.dto.RegisterRequest;
import com.vesper.backend.vo.AuthVO;
import com.vesper.backend.vo.UserVO;

public interface AuthService {

    AuthVO register(RegisterRequest request);

    AuthVO login(LoginRequest request);

    UserVO me();
}
