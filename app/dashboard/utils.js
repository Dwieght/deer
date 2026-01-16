export function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateInput(dateValue) {
  if (!dateValue) {
    return "";
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-CA");
}

export function normalizeImageUrl(url) {
  const value = String(url || "").trim();
  if (!value) {
    return "";
  }
  if (!value.includes("drive.google.com")) {
    return value;
  }
  const fileMatch = value.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
  }
  const idMatch = value.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
  }
  if (value.includes("/uc?")) {
    if (value.includes("export=")) {
      return value.replace("export=download", "export=view");
    }
    return value.includes("?") ? `${value}&export=view` : `${value}?export=view`;
  }
  return value;
}

export function extractDriveFileId(url) {
  if (!url || !url.includes("drive.google.com")) {
    return "";
  }
  const fileMatch = url.match(/\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return fileMatch[1];
  }
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) {
    return idMatch[1];
  }
  return "";
}

export function driveThumbnailUrl(url) {
  const id = extractDriveFileId(url);
  if (!id) {
    return "";
  }
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
}

export function getQrPreviewUrl(url) {
  return driveThumbnailUrl(url) || normalizeImageUrl(url);
}

export function formatAmount(amount) {
  if (amount === null || amount === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function toParams(searchParams) {
  const params = new URLSearchParams();
  if (!searchParams) {
    return params;
  }
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, item));
      return;
    }
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  return params;
}

export function buildQuery(searchParams, updates) {
  const params = toParams(searchParams);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildQueryWithAnchor(searchParams, updates, anchor) {
  const query = buildQuery(searchParams, updates);
  if (!anchor) {
    return query;
  }
  return `${query}#${anchor}`;
}

export function parsePage(value) {
  const page = Number.parseInt(String(value || "1"), 10);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return page;
}

export function normalizeSearch(value) {
  return String(value || "").trim().toLowerCase();
}

export function applySearch(items, query, getFields) {
  if (!query) {
    return items;
  }
  return items.filter((item) =>
    getFields(item).some((field) => String(field || "").toLowerCase().includes(query))
  );
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    currentPage,
  };
}

export function startOfWeek(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildWeeklyTotals(submissions, weeksCount = 8) {
  const endWeek = startOfWeek(new Date());
  if (!endWeek) {
    return [];
  }
  const totalsByWeek = new Map();
  submissions.forEach((submission) => {
    if (!submission.matched || !submission.amount) {
      return;
    }
    const baseDate = submission.matchedAt || submission.createdAt;
    const weekStart = startOfWeek(baseDate);
    if (!weekStart) {
      return;
    }
    const key = weekStart.toISOString().slice(0, 10);
    totalsByWeek.set(key, (totalsByWeek.get(key) || 0) + submission.amount);
  });
  const weeks = [];
  for (let i = weeksCount - 1; i >= 0; i -= 1) {
    const start = new Date(endWeek);
    start.setDate(endWeek.getDate() - i * 7);
    const key = start.toISOString().slice(0, 10);
    weeks.push({
      key,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: totalsByWeek.get(key) || 0,
    });
  }
  return weeks;
}

export function buildWeeklyCounts(items, weeksCount = 8, getDate = (item) => item.createdAt) {
  const endWeek = startOfWeek(new Date());
  if (!endWeek) {
    return [];
  }
  const countsByWeek = new Map();
  items.forEach((item) => {
    const baseDate = getDate(item);
    const weekStart = startOfWeek(baseDate);
    if (!weekStart) {
      return;
    }
    const key = weekStart.toISOString().slice(0, 10);
    countsByWeek.set(key, (countsByWeek.get(key) || 0) + 1);
  });
  const weeks = [];
  for (let i = weeksCount - 1; i >= 0; i -= 1) {
    const start = new Date(endWeek);
    start.setDate(endWeek.getDate() - i * 7);
    const key = start.toISOString().slice(0, 10);
    weeks.push({
      key,
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      total: countsByWeek.get(key) || 0,
    });
  }
  return weeks;
}

export function renderTableControls({
  searchParams,
  searchKey,
  pageKey,
  searchValue,
  pagination,
  placeholder,
  anchor,
}) {
  const prevDisabled = pagination.currentPage <= 1;
  const nextDisabled = pagination.currentPage >= pagination.totalPages;
  const clearHref = buildQueryWithAnchor(searchParams, { [searchKey]: "", [pageKey]: 1 }, anchor);
  const formAction = anchor ? `#${anchor}` : undefined;
  return (
    <div className="table-toolbar">
      <form method="get" className="table-search" action={formAction}>
        <input type="search" name={searchKey} defaultValue={searchValue} placeholder={placeholder} />
        <input type="hidden" name={pageKey} value="1" />
        <button className="secondary-button" type="submit">
          Search
        </button>
        {searchValue ? (
          <a className="ghost-button" href={clearHref}>
            Clear
          </a>
        ) : null}
      </form>
      <div className="pagination">
        <a
          className={`ghost-button ${prevDisabled ? "is-disabled" : ""}`}
          href={buildQueryWithAnchor(searchParams, { [pageKey]: pagination.currentPage - 1 }, anchor)}
          aria-disabled={prevDisabled}
          tabIndex={prevDisabled ? -1 : 0}
        >
          Prev
        </a>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <a
          className={`ghost-button ${nextDisabled ? "is-disabled" : ""}`}
          href={buildQueryWithAnchor(searchParams, { [pageKey]: pagination.currentPage + 1 }, anchor)}
          aria-disabled={nextDisabled}
          tabIndex={nextDisabled ? -1 : 0}
        >
          Next
        </a>
      </div>
    </div>
  );
}
