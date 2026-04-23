import { useState } from 'react';
import { ManagerAnalyticsSkeleton } from '@/components/PageSkeletons';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  ChevronLeft,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ReportExportPanel } from '@/components/ReportExportPanel';
import { UpgradePromptCard } from '@/components/UpgradePromptCard';
import { usePlan } from '@/hooks/usePlan';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export const ManagerAnalytics = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const { shiftCoverage, attendance, teamPerformance, summary, loading } = useAnalytics(period);
  const { canUseFeature } = usePlan();
  const exportsEnabled = canUseFeature('report_exports');

  if (loading) return <ManagerAnalyticsSkeleton />;

  // Prepare pie chart data for coverage
  const coveragePieData = summary ? [
    { name: 'Filled', value: summary.filledShifts },
    { name: 'Vacant', value: summary.totalShifts - summary.filledShifts },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/manager')}
              className="p-2 -ml-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Analytics</h1>
            </div>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as 'week' | 'month')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Report Exports — Enterprise */}
        {exportsEnabled ? (
          <ReportExportPanel />
        ) : (
          <UpgradePromptCard
            requiredPlan="enterprise"
            compact
            title="Export advanced reports (CSV / PDF)"
          />
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium">Total Shifts</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.totalShifts}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Coverage Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.coverageRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">On-Time Rate</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.onTimeRate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium">Hours Scheduled</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{summary.totalHoursScheduled}h</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shift Coverage Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Coverage Trend</CardTitle>
            <CardDescription>Daily coverage rate over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={shiftCoverage}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="coverage"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Daily attendance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="present" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="late" stackId="a" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="absent" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-xs text-muted-foreground">Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Pie Chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Coverage</CardTitle>
              <CardDescription>Filled vs vacant shifts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={coveragePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Filled ({summary?.filledShifts})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-xs text-muted-foreground">Vacant ({(summary?.totalShifts || 0) - (summary?.filledShifts || 0)})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Top performers by shifts completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.slice(0, 5).map((worker, index) => (
                  <div key={worker.workerId} className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                      index === 0 ? 'bg-primary/20 text-primary' : 'bg-accent text-muted-foreground'
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{worker.workerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {worker.shiftsCompleted} shifts • {worker.onTimeRate}% on-time
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        worker.reliabilityScore >= 80 
                          ? 'bg-primary/10 text-primary' 
                          : worker.reliabilityScore >= 60
                            ? 'bg-warning/10 text-warning'
                            : 'bg-destructive/10 text-destructive'
                      )}>
                        {worker.reliabilityScore}%
                      </span>
                    </div>
                  </div>
                ))}
                {teamPerformance.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No performance data yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagerAnalytics;
