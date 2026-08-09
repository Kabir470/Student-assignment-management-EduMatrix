using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Interfaces;
using EduMatrix.Application.Common;

namespace EduMatrix.Application.Announcements;

public class AnnouncementDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public bool IsGlobal { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public static AnnouncementDto From(Announcement a, string authorName) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Content = a.Content,
        AuthorId = a.AuthorId,
        AuthorName = authorName,
        IsGlobal = a.IsGlobal,
        CreatedAt = a.CreatedAt
    };
}

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsGlobal { get; set; } = true;
}

public class AnnouncementService
{
    private readonly IAnnouncementRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly ICurrentUserService _currentUser;

    public AnnouncementService(IAnnouncementRepository repo, IUserRepository userRepo, ICurrentUserService currentUser)
    {
        _repo = repo;
        _userRepo = userRepo;
        _currentUser = currentUser;
    }

    public async Task<Result<List<AnnouncementDto>>> GetAllAsync()
    {
        var announcements = await _repo.GetAllAsync(20);
        var dtos = new List<AnnouncementDto>();
        foreach (var a in announcements)
        {
            var author = await _userRepo.GetByIdAsync(a.AuthorId);
            dtos.Add(AnnouncementDto.From(a, author != null ? $"{author.FirstName} {author.LastName}" : "Admin"));
        }
        return Result<List<AnnouncementDto>>.Success(dtos);
    }

    public async Task<Result<Guid>> CreateAsync(CreateAnnouncementRequest request)
    {
        var authorId = _currentUser.UserId;
        if (!authorId.HasValue) return Result<Guid>.Failure("Unauthorized.");

        var announcement = new Announcement
        {
            Title = request.Title,
            Content = request.Content,
            AuthorId = authorId.Value,
            IsGlobal = request.IsGlobal,
        };

        var id = await _repo.CreateAsync(announcement);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> DeleteAsync(Guid id)
    {
        var announcement = await _repo.GetByIdAsync(id);
        if (announcement == null) return Result.Failure("Announcement not found.");

        // Only the author or admin can delete
        var role = _currentUser.UserRole;
        var userId = _currentUser.UserId;
        if (role != "Admin" && announcement.AuthorId != userId)
            return Result.Failure("Unauthorized.");

        await _repo.DeleteAsync(id);
        return Result.Success();
    }
}
