using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Common;
using EduMatrix.Application.AssignmentPosts.DTOs;

namespace EduMatrix.Application.AssignmentPosts;

public class AssignmentPostService
{
    private readonly IAssignmentPostRepository _repository;

    public AssignmentPostService(IAssignmentPostRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<AssignmentPostDto>>> GetPostsForAssignmentAsync(Guid assignmentId)
    {
        var posts = await _repository.GetPostsForAssignmentAsync(assignmentId);
        return Result<List<AssignmentPostDto>>.Success(posts);
    }

    public async Task<Result<Guid>> CreatePostAsync(Guid assignmentId, Guid authorId, string content)
    {
        var id = await _repository.CreatePostAsync(assignmentId, authorId, content);
        return Result<Guid>.Success(id);
    }

    public async Task<Result<Guid>> CreateCommentAsync(Guid postId, Guid authorId, string content)
    {
        var id = await _repository.CreateCommentAsync(postId, authorId, content);
        return Result<Guid>.Success(id);
    }

    public async Task<Result> DeletePostAsync(Guid id, Guid currentUserId, string currentUserRole)
    {
        var postAuthorId = await _repository.GetPostAuthorIdAsync(id);
        if (!postAuthorId.HasValue) return Result.Failure("Post not found.");
        
        if (postAuthorId.Value != currentUserId && currentUserRole != "Admin" && currentUserRole != "Teacher")
            return Result.Failure("Unauthorized to delete this post.");

        await _repository.DeletePostAsync(id);
        return Result.Success();
    }
}
