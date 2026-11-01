import { Link } from 'react-router-dom';

export function Tag({ name, onClick }: { name: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="tag">
        #{name}
      </button>
    );
  }
  return (
    <Link to={`/?tag=${encodeURIComponent(name)}`} className="tag">
      #{name}
    </Link>
  );
}
