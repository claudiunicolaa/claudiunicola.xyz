/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/5RABcYP7dpw
 */
import { AvatarImage, AvatarFallback, Avatar } from "@/components/ui/avatar"
import { CardHeader, CardContent, Card } from "@/components/ui/card"
import Link from "next/link"

export function Component() {
  return (
    <main className="container mx-auto p-10">
      <section className="mb-10">
        <div className="flex space-x-4 items-center">
          <Avatar className="h-16 w-16">
            <AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
            <AvatarFallback>SE</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-4xl font-bold">Senior Software Engineer</h1>
            <p className="text-gray-500">Backend Specialist</p>
          </div>
        </div>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Introduction</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              Experienced backend software engineer with a passion for developing efficient and scalable server-side
              applications. Proficient in modern development languages and frameworks.
            </p>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Experience</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Lead Backend Developer, XYZ Corp</h3>
                <p className="text-gray-500">2018 - Present</p>
                <p>Implemented backend services using Node.js and MongoDB, improving application performance by 20%.</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Software Engineer, ABC Inc</h3>
                <p className="text-gray-500">2015 - 2018</p>
                <p>Developed microservices in Java and Spring Boot, resulting in a more robust and scalable system.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Projects</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Open Source Contribution</h3>
                <p className="text-gray-500">
                  Contributor to the Node.js project, with a focus on improving performance and security.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Personal Project - API Development</h3>
                <p className="text-gray-500">
                  Developed a REST API for a personal project using Express.js, demonstrating a deep understanding of
                  backend development.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Volunteer Work</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Coding for Kids, Volunteer Instructor</h3>
                <p className="text-gray-500">
                  Taught basic coding concepts to children in an engaging and interactive way.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Education</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Bachelor of Science in Computer Science</h3>
                <p className="text-gray-500">XYZ University, 2012 - 2016</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Awards</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">Best Developer, XYZ Corp</h3>
                <p className="text-gray-500">Awarded for exceptional performance and contributions to the team.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Languages</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">English</h3>
                <p className="text-gray-500">Native Proficiency</p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Spanish</h3>
                <p className="text-gray-500">Professional Working Proficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Contact Information</h2>
          </CardHeader>
          <CardContent>
            <p>
              Email:{" "}
              <Link className="text-blue-500 underline" href="#">
                example@example.com
              </Link>
            </p>
            <p>
              LinkedIn:{" "}
              <Link className="text-blue-500 underline" href="#">
                linkedin.com/in/example
              </Link>
            </p>
            <p>
              Github:{" "}
              <Link className="text-blue-500 underline" href="#">
                github.com/example
              </Link>
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}