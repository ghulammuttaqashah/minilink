import { Link } from "react-router-dom";

export default function Brand() {
  return (
    <Link className="text-xl font-bold tracking-[-0.08em] text-white" to="/" aria-label="Minilink home">
      mini<span className="text-lime-300">link</span><i className="text-lime-300 not-italic">.</i>
    </Link>
  );
}
