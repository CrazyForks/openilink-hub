import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { ReviewCard } from "./plugin-review";

export function AdminReviewsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [plugins, setPlugins] = useState<any[]>([]);

  function loadApps() {
    api.adminListApps().then(setApps);
  }
  function loadPlugins() {
    api.listPlugins("pending").then(setPlugins);
  }

  useEffect(() => {
    loadApps();
    loadPlugins();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
          <ClipboardCheck className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">审核中心</h2>
          <p className="text-muted-foreground">审核应用上架与插件发布请求。</p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">应用审核</h3>
        <Card className="border-border/50 rounded-3xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>应用名称</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>开发者</TableHead>
                <TableHead>市场状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-bold">{a.name}</TableCell>
                  <TableCell className="font-mono text-xs opacity-60">{a.slug}</TableCell>
                  <TableCell className="text-xs">{a.owner_username}</TableCell>
                  <TableCell><Badge variant={a.listed ? "default" : "secondary"}>{a.listed ? "已上架" : "待上架"}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={async () => { await api.setAppListed(a.id, !a.listed); loadApps(); }}>
                      {a.listed ? "下架" : "上架"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-bold">插件审核</h3>
        {plugins.length === 0 ? (
          <p className="text-sm text-muted-foreground">暂无待审核插件。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plugins.map(p => (
              <ReviewCard key={p.id} plugin={p} onRefresh={loadPlugins} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
