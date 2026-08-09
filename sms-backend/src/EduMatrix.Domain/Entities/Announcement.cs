using System;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Entities;

public class Announcement : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid AuthorId { get; set; }
    public bool IsGlobal { get; set; } = true;
}
