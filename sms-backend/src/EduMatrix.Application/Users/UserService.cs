using System;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Enums;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.Users.DTOs;
using System.Linq;
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace EduMatrix.Application.Users;

public class UserService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;
    private readonly HttpClient _httpClient;

    public UserService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
        _httpClient = new HttpClient();
    }

    public async Task<Result<PagedResult<UserDto>>> GetUsersAsync(int page, int pageSize, string? search, UserRole? role)
    {
        var result = await _userRepository.GetUsersAsync(page, pageSize, search, role);
        var dtos = new System.Collections.Generic.List<UserDto>();
        foreach (var u in result.Data)
        {
            dtos.Add(UserDto.FromUser(u));
        }
        return Result<PagedResult<UserDto>>.Success(new PagedResult<UserDto>(dtos, result.TotalCount, result.Page, result.PageSize));
    }

    public async Task<Result<UserDto>> GetByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return Result<UserDto>.Failure("User not found.");
        return Result<UserDto>.Success(UserDto.FromUser(user));
    }

    public async Task<Result<Guid>> CreateAsync(CreateUserRequest request)
    {
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null)
            return Result<Guid>.Failure("Email is already in use.");

        var supabaseUrl = _configuration["Supabase:Url"];
        var serviceRoleKey = _configuration["Supabase:ServiceRoleKey"];
        if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(serviceRoleKey))
            return Result<Guid>.Failure("Supabase configuration is missing.");

        // Call Supabase Admin API to create user
        var req = new HttpRequestMessage(HttpMethod.Post, $"{supabaseUrl}/auth/v1/admin/users");
        req.Headers.Add("apikey", serviceRoleKey);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        
        req.Content = JsonContent.Create(new {
            email = request.Email,
            password = request.Password,
            email_confirm = true
        });

        var res = await _httpClient.SendAsync(req);
        if (!res.IsSuccessStatusCode)
        {
            var err = await res.Content.ReadAsStringAsync();
            return Result<Guid>.Failure($"Failed to create user in Supabase: {err}");
        }

        var resContent = await res.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(resContent);
        var authUserId = doc.RootElement.GetProperty("id").GetGuid();

        var user = new User
        {
            Id = authUserId,
            Email = request.Email,
            FirstName = request.FirstName,
            LastName = request.LastName,
            InstitutionalId = request.InstitutionalId,
            Role = request.Role,
            IsActive = request.IsActive
        };

        var id = await _userRepository.CreateAsync(user);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> UpdateAsync(Guid id, UpdateUserRequest request)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return Result.Failure("User not found.");

        if (!string.IsNullOrEmpty(request.Email) && request.Email != user.Email)
        {
            var existingUser = await _userRepository.GetByEmailAsync(request.Email);
            if (existingUser != null)
                return Result.Failure("Email is already in use.");
            user.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.FirstName)) user.FirstName = request.FirstName;
        if (!string.IsNullOrEmpty(request.LastName)) user.LastName = request.LastName;
        if (request.InstitutionalId != null) user.InstitutionalId = request.InstitutionalId;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;

        await _userRepository.UpdateAsync(user);
        return Result.Success();
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return Result.Failure("User not found.");

        await _userRepository.DeleteAsync(id);
        return Result.Success();
    }

    public async Task<Result> ToggleActiveAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return Result.Failure("User not found.");

        user.IsActive = !user.IsActive;
        await _userRepository.UpdateAsync(user);
        return Result.Success();
    }

    public async Task<Result<string>> GetNextInstitutionalIdAsync(UserRole role)
    {
        var maxId = await _userRepository.GetMaxInstitutionalIdAsync(role);
        
        if (string.IsNullOrEmpty(maxId))
        {
            // Default starting IDs
            return Result<string>.Success(role == UserRole.Student ? "202600001" : "F2026001");
        }

        // Extract numeric part
        var numericStr = new string(maxId.Where(char.IsDigit).ToArray());
        var prefixStr = maxId.Substring(0, maxId.Length - numericStr.Length);

        if (long.TryParse(numericStr, out long numericValue))
        {
            var nextValue = numericValue + 1;
            var nextId = prefixStr + nextValue.ToString(new string('0', numericStr.Length));
            return Result<string>.Success(nextId);
        }

        return Result<string>.Success(maxId + "-1");
    }
}
