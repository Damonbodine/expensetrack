"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  PlayCircle,
  RotateCcw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoStep = {
  id: string;
  title: string;
  body: string;
  whyItMatters: string;
  routePrefix: string;
  target?: string;
  actionLabel?: string;
  actionTarget?: string;
};

type DemoScenario = {
  id: string;
  title: string;
  estimatedMinutes: number;
  description: string;
  steps: DemoStep[];
};

const EXPENSETRACK_SCENARIO: DemoScenario = {
  id: "expense-submitter-review",
  title: "Expense Submission Review",
  estimatedMinutes: 2,
  description:
    "Show how ExpenseTrack helps a nonprofit employee track spending, inspect submitted expenses, and package reimbursement reports.",
  steps: [
    {
      id: "dashboard-overview",
      title: "Start with the submitter dashboard",
      body:
        "The personal dashboard summarizes current-month spending, pending reports, approved totals, and reimbursements for the logged-in staff member.",
      whyItMatters:
        "Skeptical teams want to see that the app works for everyday staff, not just finance reviewers.",
      routePrefix: "/my-dashboard",
      target: "[data-demo='dashboard-overview']",
      actionLabel: "Open my dashboard",
    },
    {
      id: "dashboard-recent",
      title: "Review recent expenses and reports",
      body:
        "The recent activity tables let staff jump directly from their summary view into the latest expenses and reports.",
      whyItMatters:
        "This proves the dashboard is actionable instead of just being a wall of summary cards.",
      routePrefix: "/my-dashboard",
      target: "[data-demo='dashboard-recent']",
    },
    {
      id: "expenses-list",
      title: "Open the expenses workspace",
      body:
        "The expenses page lets staff search by merchant, category, status, and amount before opening a specific submission.",
      whyItMatters:
        "This is where staff move from a personal summary into the transaction history they actually manage.",
      routePrefix: "/expenses",
      target: "[data-demo='expenses-list']",
      actionLabel: "Open expenses",
    },
    {
      id: "expense-create",
      title: "Start a new expense submission",
      body:
        "The new expense form captures the title, amount, merchant, category, payment method, and receipt details for a submission.",
      whyItMatters:
        "Even when an account starts empty, the demo should show how quickly staff can begin a compliant submission.",
      routePrefix: "/expenses/new",
      target: "[data-demo='expense-create']",
      actionTarget: "[data-demo='primary-new-expense']",
    },
    {
      id: "reports-list",
      title: "Move into expense reports",
      body:
        "Reports package expenses into reimbursement-ready bundles that staff can submit for review.",
      whyItMatters:
        "Nonprofits often reimburse through grouped reports, so the demo should show that packaging step clearly.",
      routePrefix: "/reports",
      target: "[data-demo='reports-list']",
      actionLabel: "Open reports",
    },
    {
      id: "report-create",
      title: "Start a reimbursement report",
      body:
        "The report form packages expenses into a reimbursement-ready submission with a title, period, and optional expense selection.",
      whyItMatters:
        "This closes the loop from individual spend entry to a real packet staff can hand off for approval.",
      routePrefix: "/reports/new",
      target: "[data-demo='report-create']",
      actionTarget: "[data-demo='primary-new-report']",
    },
  ],
};

const EXPENSETRACK_APPROVER_SCENARIO: DemoScenario = {
  id: "expense-approver-review",
  title: "Expense Approval Review",
  estimatedMinutes: 2,
  description:
    "Show how an approver reviews queue pressure, opens a pending report, and makes a defensible reimbursement decision.",
  steps: [
    {
      id: "approver-dashboard-overview",
      title: "Start with the approver dashboard",
      body:
        "The approver dashboard highlights pending reviews, recent decisions, and department-level spending pressure for the person responsible for signoff.",
      whyItMatters:
        "Finance reviewers need a queue-oriented view that helps them prioritize decisions instead of hunting through raw expense records.",
      routePrefix: "/approver-dashboard",
      target: "[data-demo='approver-dashboard-overview']",
      actionLabel: "Open approver dashboard",
    },
    {
      id: "approver-dashboard-queue",
      title: "Inspect review volume and recent decisions",
      body:
        "This screen shows how many reports are still waiting, what has been decided recently, and which departments are driving the most spend.",
      whyItMatters:
        "A nonprofit finance lead needs immediate signal on queue load and departmental risk before opening an individual report.",
      routePrefix: "/approver-dashboard",
      target: "[data-demo='approver-dashboard-queue']",
    },
    {
      id: "approvals-list",
      title: "Move into the approvals queue",
      body:
        "The approvals workspace narrows the reviewer into the exact reports awaiting action, with submitter, total, and status visible at a glance.",
      whyItMatters:
        "This proves the workflow supports real operational triage rather than hiding everything behind a dashboard summary.",
      routePrefix: "/approvals",
      target: "[data-demo='approvals-list']",
      actionLabel: "Open approvals",
    },
    {
      id: "approval-detail",
      title: "Open a pending report for review",
      body:
        "Reviewers can jump directly from the queue into a full report detail page with receipts, line items, and approval history.",
      whyItMatters:
        "Skeptical teams want to see the actual review surface, not just a list of pending records.",
      routePrefix: "/approvals/",
      target: "[data-demo='approval-detail']",
      actionLabel: "Open report",
      actionTarget: "[data-demo='primary-approval-link']",
    },
    {
      id: "approval-actions",
      title: "Show the decision controls",
      body:
        "Approvers can approve, return, or reject a report with documented comments, then send it back into the workflow.",
      whyItMatters:
        "This is the control point that proves ExpenseTrack supports real governance, not just expense intake.",
      routePrefix: "/approvals/",
      target: "[data-demo='approval-actions']",
    },
  ],
};

const SCENARIO_START_PATHS: Record<string, string> = {
  "expense-submitter-review": "/my-dashboard?demo=expense-submitter-review&step=1",
  "expense-approver-review": "/approver-dashboard?demo=expense-approver-review&step=1",
};

function getScenarioById(id: string | null): DemoScenario | null {
  if (id === EXPENSETRACK_SCENARIO.id) return EXPENSETRACK_SCENARIO;
  if (id === EXPENSETRACK_APPROVER_SCENARIO.id) return EXPENSETRACK_APPROVER_SCENARIO;
  return null;
}

function routeMatches(pathname: string, routePrefix: string) {
  if (routePrefix.endsWith("/")) {
    return pathname.startsWith(routePrefix);
  }
  return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
}

export function DemoMode() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const demoId = searchParams.get("demo");
  const stepParam = searchParams.get("step");
  const scenario = useMemo(() => getScenarioById(demoId), [demoId]);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!scenario) {
      setStepIndex(0);
      return;
    }
    const parsedStep = Number(stepParam ?? "1");
    const nextStepIndex =
      Number.isFinite(parsedStep) && parsedStep > 0
        ? Math.min(parsedStep - 1, scenario.steps.length - 1)
        : 0;
    setStepIndex((prev) => (prev === nextStepIndex ? prev : nextStepIndex));
  }, [demoId, scenario, stepParam]);

  const currentStep = scenario?.steps[stepIndex];

  useEffect(() => {
    if (!scenario) return;
    const nextStepParam = String(stepIndex + 1);
    if (stepParam === nextStepParam) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("demo", scenario.id);
    params.set("step", nextStepParam);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, scenario, searchParams, stepIndex, stepParam]);

  useEffect(() => {
    if (!currentStep?.target) return;
    const element = document.querySelector(currentStep.target);
    if (!element) return;
    element.setAttribute("data-demo-active", "true");
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    return () => {
      element.removeAttribute("data-demo-active");
    };
  }, [currentStep, pathname]);

  if (!scenario || !currentStep) return null;

  const activeScenario = scenario;
  const activeStep = currentStep;
  const onExpectedRoute = routeMatches(pathname, activeStep.routePrefix);
  const isLastStep = stepIndex === activeScenario.steps.length - 1;

  function updateSearch(nextDemo: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextDemo) {
      params.set("demo", nextDemo);
      params.set("step", String(stepIndex + 1));
    } else {
      params.delete("demo");
      params.delete("step");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function nextStep() {
    if (!onExpectedRoute) {
      if (activeStep.actionTarget) {
        const target = document.querySelector<HTMLElement>(activeStep.actionTarget);
        if (target) {
          target.click();
          return;
        }
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("demo", activeScenario.id);
      params.set("step", String(stepIndex + 1));
      const route = activeStep.routePrefix.endsWith("/")
        ? activeStep.routePrefix.slice(0, -1)
        : activeStep.routePrefix;
      router.push(`${route}?${params.toString()}`);
      return;
    }
    if (isLastStep) {
      exitDemo();
      return;
    }
    setStepIndex((prev) => prev + 1);
  }

  function previousStep() {
    if (stepIndex > 0) setStepIndex((prev) => prev - 1);
  }

  function restartScenario() {
    setStepIndex(0);
    router.push(SCENARIO_START_PATHS[activeScenario.id] ?? SCENARIO_START_PATHS["expense-submitter-review"]);
  }

  function exitDemo() {
    updateSearch(null);
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 w-full max-w-md">
      <div className="pointer-events-auto rounded-2xl border border-border bg-card/95 p-5 shadow-2xl backdrop-blur">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                Guided Demo
              </Badge>
              <span className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {activeScenario.steps.length}
              </span>
            </div>
            <h2 className="text-xl font-semibold">{activeScenario.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{activeScenario.description}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={exitDemo}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((stepIndex + 1) / activeScenario.steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          <div data-demo-panel-step={activeStep.id}>
            <h3 className="text-base font-semibold">{activeStep.title}</h3>
            <p className="mt-1 text-sm text-foreground/90">{activeStep.body}</p>
          </div>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Why this matters
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{activeStep.whyItMatters}</p>
          </div>
          {!onExpectedRoute && (
            <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-sm text-primary">
              Go to the next screen to continue this walkthrough.
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousStep} disabled={stepIndex === 0}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            <Button variant="ghost" size="sm" onClick={restartScenario}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Restart
            </Button>
          </div>
          <Button size="sm" onClick={nextStep}>
            {!onExpectedRoute ? (
              <>
                <Compass className="mr-1.5 h-4 w-4" />
                {activeStep.actionLabel ?? "Go there"}
              </>
            ) : isLastStep ? (
              "Finish"
            ) : (
              <>
                Next
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {isLastStep && onExpectedRoute && (
          <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            You&apos;ve completed the guided demo. Keep exploring, or restart the scenario any time.
          </div>
        )}
      </div>
    </div>
  );
}

export function DemoModeStartButton({
  className,
  scenarioId = "expense-submitter-review",
  label = "Start guided demo",
}: {
  className?: string;
  scenarioId?: keyof typeof SCENARIO_START_PATHS;
  label?: string;
}) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      className={cn("gap-2", className)}
      onClick={() =>
        router.push(
          SCENARIO_START_PATHS[scenarioId] ?? SCENARIO_START_PATHS["expense-submitter-review"],
        )
      }
    >
      <PlayCircle className="h-4 w-4" />
      {label}
    </Button>
  );
}
