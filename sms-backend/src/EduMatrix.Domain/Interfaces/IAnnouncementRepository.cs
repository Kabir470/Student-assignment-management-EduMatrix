using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EduMatrix.Domain.Entities;
using EduMatrix.Domain.Common;

namespace EduMatrix.Domain.Interfaces;

public interface IAnnouncementRepository
{
    Task<List<Announcement>> GetAllAsync(int limit = 20);
    Task<Announcement?> GetByIdAsync(Guid id);
    Task<Guid> CreateAsync(Announcement announcement);
    Task DeleteAsync(Guid id);
}
