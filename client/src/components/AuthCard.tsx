import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link, useNavigate } from "react-router"
import { useFormik } from "formik"
import * as Yup from "yup"
import { useAuthMutation } from "@/state/actions/useAuthMutation"

interface AuthCardProps {
  isLogin: boolean;
}

const authSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().min(6, "Password too short").required("Password is required"),
});

export function AuthCard({ isLogin }: AuthCardProps) {
  const navigate = useNavigate();
  const authMutation = useAuthMutation(isLogin);

  const formik = useFormik({
    initialValues: { email: "", password: "" },
    validationSchema: authSchema,
    onSubmit: (values) => {
      authMutation.mutate(values, {
        onSuccess: () => {
          navigate("/notebook");
        },
      });
    },
  });

  const cardTitle = isLogin ? "Login to your account" : "Make a new account"
  const cardDescription = isLogin ? "Enter your email below to login to your account" : "Enter your email below to make a new account"
  const cardFooter = isLogin ? "Login" : "SignUp"
  const cardAction = isLogin ? "signup" : ""
  const actionLabel = isLogin ? "signup" : "login"

    return (
      <main className="h-screen w-full bg-background flex justify-center items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
          <CardAction>
            <Link to={`/${cardAction}`} className="text-primary hover:underline">
              {actionLabel}
            </Link>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form onSubmit={formik.handleSubmit}>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.email && formik.errors.email && (
                  <span className="text-xs text-red-500">{formik.errors.email as string}</span>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot?
                    </a>
                  )}
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
                {formik.touched.password && formik.errors.password && (
                  <span className="text-xs text-red-500">{formik.errors.password as string}</span>
                )}
              </div>
              {authMutation.isError && (
                <span className="text-sm text-red-500 text-center">
                  {(authMutation.error as any).response?.data?.error || "An error occurred"}
                </span>
              )}
              <Button
                type="submit"
                className="w-full mt-2"
                disabled={authMutation.isPending}
              >
                {authMutation.isPending ? "Processing..." : cardFooter}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          {/* Footer content if any */}
        </CardFooter>
      </Card>
    </main>
  )
}
