using System.Collections.Generic;

namespace EduMatrix.Domain.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Data { get; }
    public int TotalCount { get; }
    public int Page { get; }
    public int PageSize { get; }

    public PagedResult(IReadOnlyList<T> data, int totalCount, int page, int pageSize)
    {
        Data = data;
        TotalCount = totalCount;
        Page = page;
        PageSize = pageSize;
    }
}
