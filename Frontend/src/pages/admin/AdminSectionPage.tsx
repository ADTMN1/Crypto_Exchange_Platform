interface AdminSectionPageProps {
  title: string
  description: string
}

export default function AdminSectionPage({ title, description }: AdminSectionPageProps) {
  return (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  )
}
