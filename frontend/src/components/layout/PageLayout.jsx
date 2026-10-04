function PageLayout({
  eyebrow,
  title,
  description,
  action,
  children,
}) {
  return (
    <div className="page">

      <div className="page-heading">

        <div>

          {eyebrow && (
            <div className="page-eyebrow">
              {eyebrow}
            </div>
          )}

          <h2>
            {title}
          </h2>

          {description && (
            <p>
              {description}
            </p>
          )}

        </div>


        {action && (
          <div className="page-action">
            {action}
          </div>
        )}

      </div>


      {children}

    </div>
  );
}

export default PageLayout;
