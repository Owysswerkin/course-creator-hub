import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, BookOpen, CheckCircle2, Circle, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("*, lessons(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      data.lessons = (data.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      return data;
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("*")
        .eq("course_id", id!)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", id],
    queryFn: async () => {
      const lessonIds = course?.lessons?.map((l: any) => l.id) || [];
      if (lessonIds.length === 0) return [];
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", user!.id)
        .in("lesson_id", lessonIds);
      return data?.map((p) => p.lesson_id) || [];
    },
    enabled: !!user && !!course?.lessons?.length,
  });

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("enrollments").insert({ course_id: id!, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment", id] });
      toast({ title: "Enrolled!", description: "You're now enrolled in this course." });
    },
  });

  const toggleLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const isCompleted = progress?.includes(lessonId);
      if (isCompleted) {
        await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId).eq("user_id", user!.id);
      } else {
        await supabase.from("lesson_progress").insert({ lesson_id: lessonId, user_id: user!.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress", id] });
    },
  });

  const activeLesson = course?.lessons?.find((l: any) => l.id === selectedLesson);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-serif">Course not found</h1>
        <Link to="/"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Back to courses</Button></Link>
      </div>
    );
  }

  const completedCount = progress?.length || 0;
  const totalLessons = course.lessons?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-primary" />
            <span className="text-xl font-serif text-foreground">Instructional</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            ) : (
              <Link to="/auth"><Button size="sm">Sign in</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> All courses
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h1 className="text-2xl font-serif text-foreground">{course.title}</h1>
              {course.description && <p className="text-muted-foreground mt-2">{course.description}</p>}
            </div>

            {user && !enrollment && (
              <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="w-full">
                {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll in this course"}
              </Button>
            )}

            {user && enrollment && totalLessons > 0 && (
              <div className="text-sm text-muted-foreground">
                {completedCount}/{totalLessons} lessons completed
              </div>
            )}

            <div className="space-y-1">
              {course.lessons?.map((lesson: any, i: number) => {
                const isCompleted = progress?.includes(lesson.id);
                const isActive = selectedLesson === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 text-sm transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {user && enrollment ? (
                      isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )
                    ) : (
                      <span className="text-xs text-muted-foreground w-4 text-center shrink-0">{i + 1}</span>
                    )}
                    <span className="line-clamp-1">{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2">
            {activeLesson ? (
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-serif text-foreground">{activeLesson.title}</h2>
                    {user && enrollment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLessonMutation.mutate(activeLesson.id)}
                        disabled={toggleLessonMutation.isPending}
                      >
                        {progress?.includes(activeLesson.id) ? (
                          <><CheckCircle2 className="h-4 w-4 text-primary mr-1" /> Completed</>
                        ) : (
                          <><Circle className="h-4 w-4 mr-1" /> Mark complete</>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                    {activeLesson.content || "No content yet."}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <h2 className="text-lg font-serif text-foreground mb-1">Select a lesson</h2>
                <p className="text-sm text-muted-foreground">Choose a lesson from the sidebar to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
