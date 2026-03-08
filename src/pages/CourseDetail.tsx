import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, BookOpen, CheckCircle2, Circle, LogOut, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [showLessons, setShowLessons] = useState(false);

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 px-4">
        <h1 className="text-xl sm:text-2xl font-serif text-center">Course not found</h1>
        <Link to="/"><Button variant="ghost"><ArrowLeft className="h-4 w-4 mr-2" />Back to courses</Button></Link>
      </div>
    );
  }

  const completedCount = progress?.length || 0;
  const totalLessons = course.lessons?.length || 0;

  const LessonsList = () => (
    <div className="space-y-1">
      {course.lessons?.map((lesson: any, i: number) => {
        const isCompleted = progress?.includes(lesson.id);
        const isActive = selectedLesson === lesson.id;
        return (
          <button
            key={lesson.id}
            onClick={() => {
              setSelectedLesson(lesson.id);
              setShowLessons(false);
            }}
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
  );

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 sm:px-6 lg:px-8 flex h-14 sm:h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            <span className="text-lg sm:text-xl font-serif text-foreground">Instructional</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
            ) : (
              <Link to="/auth"><Button size="sm" className="text-xs sm:text-sm">Sign in</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6">
          <ArrowLeft className="h-4 w-4" /> All courses
        </Link>

        {/* Mobile: Course title and collapsible lessons */}
        <div className="lg:hidden mb-4">
          <h1 className="text-xl sm:text-2xl font-serif text-foreground">{course.title}</h1>
          {course.description && <p className="text-muted-foreground mt-2 text-sm">{course.description}</p>}
          
          {user && !enrollment && (
            <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} className="w-full mt-4">
              {enrollMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll in this course"}
            </Button>
          )}

          {user && enrollment && totalLessons > 0 && (
            <div className="text-sm text-muted-foreground mt-3">
              {completedCount}/{totalLessons} lessons completed
            </div>
          )}

          {/* Collapsible lessons for mobile */}
          <button
            onClick={() => setShowLessons(!showLessons)}
            className="flex items-center justify-between w-full mt-4 py-3 px-4 bg-muted/50 rounded-lg text-sm font-medium"
          >
            <span>Lessons ({totalLessons})</span>
            {showLessons ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {showLessons && (
            <div className="mt-2 bg-card rounded-lg border border-border p-2">
              <LessonsList />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Desktop sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
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

            <LessonsList />
          </div>

          <div className="lg:col-span-2">
            {activeLesson ? (
              <Card>
                <CardContent className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <h2 className="text-lg sm:text-xl font-serif text-foreground">{activeLesson.title}</h2>
                    {user && enrollment && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleLessonMutation.mutate(activeLesson.id)}
                        disabled={toggleLessonMutation.isPending}
                        className="self-start sm:self-auto"
                      >
                        {progress?.includes(activeLesson.id) ? (
                          <><CheckCircle2 className="h-4 w-4 text-primary mr-1" /> Completed</>
                        ) : (
                          <><Circle className="h-4 w-4 mr-1" /> Mark complete</>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="prose prose-sm sm:prose prose-neutral dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-serif text-foreground mt-6 mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-lg sm:text-xl font-serif text-foreground mt-5 mb-3">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-base sm:text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                        p: ({ children }) => <p className="text-sm sm:text-base text-foreground leading-relaxed mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 text-sm sm:text-base">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-sm sm:text-base">{children}</ol>,
                        li: ({ children }) => <li className="text-foreground">{children}</li>,
                        code: ({ className, children }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono text-foreground">{children}</code>
                          ) : (
                            <code className="block bg-muted p-3 sm:p-4 rounded-lg text-xs sm:text-sm font-mono overflow-x-auto">{children}</code>
                          );
                        },
                        pre: ({ children }) => <pre className="bg-muted p-3 sm:p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4">{children}</blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {activeLesson.content || "No content yet."}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
                <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/40 mb-4" />
                <h2 className="text-base sm:text-lg font-serif text-foreground mb-1">Select a lesson</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">Choose a lesson from the {totalLessons > 0 ? "list" : "sidebar"} to start learning.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
