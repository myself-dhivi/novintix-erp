'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BriefcaseBusiness, MapPin, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Can } from '@/components/shared/can';
import { Modal } from '@/components/shared/modal';
import { PageHeader } from '@/components/shared/page-header';
import { recruitmentApi } from '@/lib/api/business.api';

const stages = [
  'APPLIED',
  'SCREENING',
  'SHORTLISTED',
  'TECHNICAL_INTERVIEW',
  'HR_INTERVIEW',
  'OFFER',
  'HIRED',
];
export default function RecruitmentPage() {
  const client = useQueryClient();
  const [tab, setTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [candidate, setCandidate] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobId: '',
    currentTitle: '',
    skills: '',
  });
  const [job, setJob] = useState({
    title: '',
    department: '',
    location: '',
    openings: 1,
    employmentType: 'Full-time',
  });
  const { data: candidates = [] } = useQuery({
    queryKey: ['candidates'],
    queryFn: recruitmentApi.candidates,
  });
  const { data: jobs = [] } = useQuery({ queryKey: ['jobs'], queryFn: recruitmentApi.jobs });
  const createCandidate = useMutation({
    mutationFn: () =>
      recruitmentApi.createCandidate({
        ...candidate,
        jobId: candidate.jobId || undefined,
        skills: candidate.skills
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['candidates'] });
      setCandidateOpen(false);
      toast.success('Candidate added');
    },
    onError: (e) => toast.error(e.message),
  });
  const createJob = useMutation({
    mutationFn: () => recruitmentApi.createJob(job),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['jobs'] });
      setJobOpen(false);
      toast.success('Job opening created');
    },
    onError: (e) => toast.error(e.message),
  });
  const move = async (id: string, stage: string) => {
    await recruitmentApi.moveCandidate(id, stage);
    await client.invalidateQueries({ queryKey: ['candidates'] });
    toast.success('Candidate moved');
  };
  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader
        eyebrow="Talent"
        title="Recruitment"
        description="Move great candidates from application to hire."
        action={
          <div className="flex gap-2">
            <Can permission="candidate.create">
              <button className="btn-secondary" onClick={() => setJobOpen(true)}>
                <BriefcaseBusiness size={16} /> New job
              </button>
              <button className="btn-primary" onClick={() => setCandidateOpen(true)}>
                <Plus size={16} /> Add candidate
              </button>
            </Can>
          </div>
        }
      />
      <div className="mb-6 inline-flex rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setTab('pipeline')}
          className={`tab-button ${tab === 'pipeline' ? 'active' : ''}`}
        >
          Candidate pipeline
        </button>
        <button
          onClick={() => setTab('jobs')}
          className={`tab-button ${tab === 'jobs' ? 'active' : ''}`}
        >
          Open jobs <span>{jobs.filter((x) => x.status === 'OPEN').length}</span>
        </button>
      </div>
      {tab === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-5">
          {stages.map((stage) => (
            <section key={stage} className="w-72 shrink-0 rounded-2xl bg-slate-100/70 p-3">
              <header className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold tracking-wide">
                  {stage.replaceAll('_', ' ')}
                </h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                  {candidates.filter((x) => x.stage === stage).length}
                </span>
              </header>
              <div className="space-y-3">
                {candidates
                  .filter((x) => x.stage === stage)
                  .map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                          {item.firstName[0]}
                          {item.lastName?.[0]}
                        </div>
                        <span className="text-[10px] text-slate-400">{item.candidateCode}</span>
                      </div>
                      <h4 className="mt-3 text-sm font-semibold">
                        {item.firstName} {item.lastName}
                      </h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.currentTitle || item.job?.title || 'General application'}
                      </p>
                      {item.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {item.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <Can permission="candidate.move_stage">
                        <select
                          value={item.stage}
                          onChange={(e) => void move(item.id, e.target.value)}
                          className="mt-4 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                        >
                          {stages.concat(['REJECTED', 'WITHDRAWN']).map((x) => (
                            <option key={x}>{x}</option>
                          ))}
                        </select>
                      </Can>
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((item) => (
            <article key={item.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
                  <BriefcaseBusiness size={19} />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  {item.status}
                </span>
              </div>
              <h3 className="mt-5 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{item.department}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin size={13} />
                  {item.location || 'Remote'}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={13} />
                  {item._count.candidates} candidates
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal open={candidateOpen} title="Add candidate" onClose={() => setCandidateOpen(false)}>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createCandidate.mutate();
          }}
        >
          {[
            ['First name', 'firstName'],
            ['Last name', 'lastName'],
            ['Email', 'email'],
            ['Phone', 'phone'],
            ['Current title', 'currentTitle'],
            ['Skills (comma separated)', 'skills'],
          ].map(([label, key]) => (
            <label key={key} className="text-xs font-medium">
              {label}
              <input
                required={['firstName', 'email'].includes(key)}
                className="input mt-1.5"
                value={candidate[key as keyof typeof candidate]}
                onChange={(e) => setCandidate({ ...candidate, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="text-xs font-medium sm:col-span-2">
            Job
            <select
              className="input mt-1.5"
              value={candidate.jobId}
              onChange={(e) => setCandidate({ ...candidate, jobId: e.target.value })}
            >
              <option value="">General application</option>
              {jobs.map((x) => (
                <option value={x.id} key={x.id}>
                  {x.title}
                </option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-secondary" onClick={() => setCandidateOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Add candidate</button>
          </div>
        </form>
      </Modal>
      <Modal open={jobOpen} title="Create job opening" onClose={() => setJobOpen(false)}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createJob.mutate();
          }}
        >
          {[
            ['Job title', 'title'],
            ['Department', 'department'],
            ['Location', 'location'],
            ['Employment type', 'employmentType'],
          ].map(([label, key]) => (
            <label key={key} className="block text-xs font-medium">
              {label}
              <input
                required={key === 'title' || key === 'department'}
                className="input mt-1.5"
                value={String(job[key as keyof typeof job])}
                onChange={(e) => setJob({ ...job, [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-xs font-medium">
            Openings
            <input
              type="number"
              min={1}
              className="input mt-1.5"
              value={job.openings}
              onChange={(e) => setJob({ ...job, openings: Number(e.target.value) })}
            />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setJobOpen(false)}>
              Cancel
            </button>
            <button className="btn-primary">Create job</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
