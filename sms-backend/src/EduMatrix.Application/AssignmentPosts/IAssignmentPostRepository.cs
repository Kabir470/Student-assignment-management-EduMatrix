using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Application.AssignmentPosts.DTOs;

namespace EduMatrix.Application.AssignmentPosts;

public interface IAssignmentPostRepository
{
    Task<List<AssignmentPostDto>> GetPostsForAssignmentAsync(Guid assignmentId);
    Task<Guid> CreatePostAsync(Guid assignmentId, Guid authorId, string content);
    Task<Guid> CreateCommentAsync(Guid postId, Guid authorId, string content);
    Task<Guid?> GetPostAuthorIdAsync(Guid postId);
    Task DeletePostAsync(Guid id);
}
