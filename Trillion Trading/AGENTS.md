<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep TanStack file-based routes and route-specific head metadata; the platform routing must remain intact despite React Router terminology in the brief.
- Keep all business operations in a browser API service layer configured by VITE_API_BASE_URL, with no in-project backend; the business connects its external service later.
- Use separate business-validated payment endpoints and backend order verification; client navigation must never establish a purchase or paid membership.
- Keep editable business values in frontend configuration and semantic styling in the global stylesheet; supplied values can change without altering architecture.
- Use cookie-based external sessions with CSRF support and backend-verified member guards; never persist passwords or sensitive tokens in browser storage.
