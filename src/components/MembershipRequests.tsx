import React, { useCallback, useEffect, useState } from 'react';
import {
  UserPlus, Check, X, Loader2, RefreshCw, Church, Phone, Mail,
  MapPin, Calendar, AlertCircle, CheckCircle2, XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  membershipRequestService, type MembershipRequest,
} from '@/services/membershipRequests';
import { usePermissions } from '@/contexts/PermissionContext';
import { useSoftwareControl } from '@/hooks/useSoftwareControl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

/**
 * The parish's inbox of membership sign-up requests.
 *
 * Approvers see only their own parish's requests; head-office (global scope)
 * roles see every parish. This mirrors the server-side rule, so the UI never
 * shows an action that Firestore would reject.
 */
export const MembershipRequests: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { user } = useAuth();
  const {
    can, isHeadOffice, myAtbiyaId, roles, roleLabel, isApproverRole, isSuperAdmin,
  } = usePermissions();
  const { showElement } = useSoftwareControl();

  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [roleChoice, setRoleChoice] = useState<Record<string, string>>({});

  const mayApprove =
    isSuperAdmin || can('canApproveMembers') || isApproverRole(user?.hierarchyLevel);
  const canAct = mayApprove && showElement('members.approve');

  // Non-admin approvers cannot grant an admin role — the rules reject it, so
  // do not offer it.
  const assignableRoles = roles.filter(
    (r) => r.active !== false && (isHeadOffice ? true : !r.isAdmin)
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRequests(await membershipRequestService.listPending(isHeadOffice ? undefined : myAtbiyaId));
    } catch (e) {
      setError(
        e instanceof Error && e.message.includes('index')
          ? 'The membership request index is still building in Firestore. Try again in a minute.'
          : 'Could not load membership requests.'
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [isHeadOffice, myAtbiyaId]);

  useEffect(() => {
    if (mayApprove) load();
    else setLoading(false);
  }, [mayApprove, load]);

  if (!mayApprove) return null;

  // A parish-scoped approver with no parish assigned would query for '' and
  // always get nothing — say so rather than showing a misleading empty state.
  const missingParish = !isHeadOffice && !myAtbiyaId;

  async function handleApprove(req: MembershipRequest) {
    setBusyId(req.id);
    setError(null);
    try {
      const role = roleChoice[req.id] ?? assignableRoles[assignableRoles.length - 1]?.key ?? 'HiyawanMahderat';
      await membershipRequestService.approve(
        req.id,
        { id: user?.id ?? '', name: user?.fullName ?? user?.username ?? '' },
        role
      );
      setNotice(`${req.fullNameEnglish ?? 'Member'} approved. They can sign in now.`);
      setRequests((r) => r.filter((x) => x.id !== req.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve this request.');
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(req: MembershipRequest) {
    setBusyId(req.id);
    setError(null);
    try {
      await membershipRequestService.reject(
        req.id,
        { id: user?.id ?? '', name: user?.fullName ?? user?.username ?? '' },
        reason
      );
      setNotice(`${req.fullNameEnglish ?? 'Request'} rejected.`);
      setRequests((r) => r.filter((x) => x.id !== req.id));
      setRejecting(null);
      setReason('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reject this request.');
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className={compact ? 'border-0 shadow-none' : undefined}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Membership Requests
            {requests.length > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-500">{requests.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isHeadOffice
              ? 'People who signed up and are waiting for approval, across every parish.'
              : 'People who chose your Atbiya when they signed up. Approving lets them sign in.'}
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {notice && (
          <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {missingParish ? (
          <div className="text-center py-10 text-muted-foreground">
            <Church className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No parish assigned to your account</p>
            <p className="text-sm max-w-md mx-auto">
              Requests are matched to a parish. Ask an administrator to set your Atbiya
              in User Management so this list can find yours.
            </p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No pending requests</p>
            <p className="text-sm">New sign-ups will appear here for review.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {requests.map((req) => (
              <motion.div key={req.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-[220px] space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold">{req.fullNameEnglish ?? req.username}</span>
                      {req.fullNameAmharic && (
                        <span className="text-sm text-muted-foreground font-ethiopic">{req.fullNameAmharic}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {req.atbiyaName && (
                        <p className="flex items-center gap-1.5"><Church className="h-3 w-3" /> {req.atbiyaName}</p>
                      )}
                      {req.phone && (
                        <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {req.phone}</p>
                      )}
                      {req.email && (
                        <p className="flex items-center gap-1.5 break-all"><Mail className="h-3 w-3" /> {req.email}</p>
                      )}
                      {req.address?.region && (
                        <p className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {[req.address.region, req.address.zone, req.address.woreda].filter(Boolean).join(' · ')}
                        </p>
                      )}
                      {req.requestedAt && (
                        <p className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Requested {new Date(req.requestedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {(req.ministryType ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {(req.ministryType ?? []).map((m) => (
                          <Badge key={m} variant="secondary" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {canAct && rejecting !== req.id && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={roleChoice[req.id] ?? assignableRoles[assignableRoles.length - 1]?.key}
                        onValueChange={(v) => setRoleChoice((c) => ({ ...c, [req.id]: v }))}
                      >
                        <SelectTrigger className="w-44 h-9 text-xs">
                          <SelectValue placeholder="Assign role" />
                        </SelectTrigger>
                        <SelectContent>
                          {assignableRoles.map((r) => (
                            <SelectItem key={r.key} value={r.key}>{roleLabel(r.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" disabled={busyId === req.id}
                        className="text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                        onClick={() => { setRejecting(req.id); setReason(''); }}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" disabled={busyId === req.id}
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(req)}>
                        {busyId === req.id
                          ? <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          : <Check className="h-4 w-4 mr-1" />}
                        Approve
                      </Button>
                    </div>
                  )}
                </div>

                {rejecting === req.id && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Textarea
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why is this request being rejected? The member will see this."
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost"
                        onClick={() => { setRejecting(null); setReason(''); }}>
                        <X className="h-4 w-4 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" variant="destructive" disabled={busyId === req.id}
                        onClick={() => handleReject(req)}>
                        {busyId === req.id && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                        Confirm rejection
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  );
};
