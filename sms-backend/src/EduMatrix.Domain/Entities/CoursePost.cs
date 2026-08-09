using System;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Entities;

public class CoursePost : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
}
