export default function LoadingScreen({ language }) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p className="loading-text">
        {language === 'en' ? 'Loading content from database...' : 'Carregando conteúdo do banco de dados...'}
      </p>
    </div>
  );
}
