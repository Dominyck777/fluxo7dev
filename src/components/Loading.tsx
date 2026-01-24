import './Loading.css';

interface LoadingProps {
  message?: string;
}

const Loading = ({ message = 'Carregando...' }: LoadingProps) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default Loading;
;