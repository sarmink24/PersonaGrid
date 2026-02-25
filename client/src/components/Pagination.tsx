import './Pagination.css';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Props {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ pagination, onPageChange }: Props) => {
  const { page, totalPages, total } = pagination;

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="pagination">
      <span className="pagination-info">{total} total</span>
      <div className="pagination-controls">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="pagination-btn"
        >
          Previous
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`pagination-btn ${p === page ? 'active' : ''}`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    </div>
  );
};
