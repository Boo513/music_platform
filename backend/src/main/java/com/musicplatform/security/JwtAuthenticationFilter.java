package com.musicplatform.security;

import com.musicplatform.entity.Admin;
import com.musicplatform.entity.User;
import com.musicplatform.mapper.AdminMapper;
import com.musicplatform.mapper.UserMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final AdminMapper adminMapper;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserMapper userMapper, AdminMapper adminMapper) {
        this.tokenProvider = tokenProvider;
        this.userMapper = userMapper;
        this.adminMapper = adminMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractToken(request);
        if (token != null && tokenProvider.validate(token)) {
            Long userId = tokenProvider.getUserId(token);
            String role = tokenProvider.getRole(token);
            UserPrincipal principal = null;

            if ("admin".equals(role)) {
                Admin admin = adminMapper.selectByUsername(tokenProvider.getUsername(token));
                if (admin != null) {
                    principal = new UserPrincipal(admin);
                }
            } else {
                User user = userMapper.selectById(userId);
                if (user != null) {
                    principal = new UserPrincipal(user);
                }
            }

            if (principal != null) {
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
