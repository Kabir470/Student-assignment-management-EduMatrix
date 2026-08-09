using System;
using System.Collections.Generic;

namespace EduMatrix.Application.AssignmentPosts.DTOs;

public class AssignmentPostDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public List<AssignmentPostCommentDto> Comments { get; set; } = new();
}

public class AssignmentPostCommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
