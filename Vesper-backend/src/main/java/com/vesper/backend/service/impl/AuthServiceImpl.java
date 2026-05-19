package com.vesper.backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.vesper.backend.dto.LoginRequest;
import com.vesper.backend.dto.RegisterRequest;
import com.vesper.backend.entity.User;
import com.vesper.backend.exception.BusinessException;
import com.vesper.backend.mapper.UserMapper;
import com.vesper.backend.security.JwtUtil;
import com.vesper.backend.service.AuthService;
import com.vesper.backend.vo.AuthVO;
import com.vesper.backend.vo.UserVO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    @Transactional
    public AuthVO register(RegisterRequest request) {
        ensureUsernameAvailable(request.getUsername());
        ensureEmailAvailable(request.getEmail());

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        userMapper.insert(user);
        return buildAuthVO(user);
    }

    @Override
    public AuthVO login(LoginRequest request) {
        User user = findByUsernameOrEmail(request.getAccount());
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessException(401, "Invalid account or password");
        }

        return buildAuthVO(user);
    }

    @Override
    public UserVO me() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserVO user)) {
            throw new BusinessException(401, "Unauthorized");
        }
        return user;
    }

    private void ensureUsernameAvailable(String username) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username));
        if (count > 0) {
            throw new BusinessException(409, "Username already exists");
        }
    }

    private void ensureEmailAvailable(String email) {
        Long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getEmail, email));
        if (count > 0) {
            throw new BusinessException(409, "Email already exists");
        }
    }

    private User findByUsernameOrEmail(String account) {
        return userMapper.selectOne(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, account)
                .or()
                .eq(User::getEmail, account)
                .last("LIMIT 1"));
    }

    private AuthVO buildAuthVO(User user) {
        String token = jwtUtil.generateToken(String.valueOf(user.getId()), Map.of(
                "username", user.getUsername(),
                "email", user.getEmail()
        ));
        return new AuthVO(token, UserVO.from(user));
    }

}
