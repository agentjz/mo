import { useNavigate } from 'react-router-dom';
import RichText from '../../components/RichText.tsx';
import { statementContent, type StatementBlock } from '../../content/statement.ts';
import './statement.css';

function StatementBlockView({ block }: { block: StatementBlock }): JSX.Element {
  if (block.type === 'list') {
    return (
      <ul>
        {block.items.map(item => <li key={item}>{item}</li>)}
      </ul>
    );
  }

  return <p><RichText content={block.content} /></p>;
}

function StatementPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="statement-page">
      <div className="statement-container">
        <header className="statement-header">
          <button className="back-link" onClick={() => navigate('/')}>
            {statementContent.backLabel}
          </button>
        </header>

        <article className="statement-content">
          <h1>{statementContent.title}</h1>
          {statementContent.sections.map(section => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <StatementBlockView key={index} block={block} />
              ))}
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}

export default StatementPage;
