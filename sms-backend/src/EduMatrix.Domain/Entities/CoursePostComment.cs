using System;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Entities;

public class CoursePostComment : BaseEntity
{
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
}
