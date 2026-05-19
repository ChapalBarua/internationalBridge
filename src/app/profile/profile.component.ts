import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';

type Stat = { num: string; label: string };

type SkillGroup = {
  label: string;
  items: string[];
  highlight?: string[];
};

type ExperienceItem = {
  role: string;
  company: string;
  period: string;
  location: string;
  current?: boolean;
  bullets: string[];
};

type ProjectItem = {
  title: string;
  tag: string;
  description: string;
  stack: string[];
  href: string;
  featured?: boolean;
  iosBadge?: boolean;
};

type EducationItem = {
  degree: string;
  school: string;
  location: string;
  initial: string;
};

type ContactItem = {
  label: string;
  value: string;
  href?: string;
  external?: boolean;
};

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {

  readonly summary = 'User Interface Engineer with 10+ years of experience building Angular-based enterprise applications, modern frontend experiences, and API-driven products. From banking risk platforms at RBC to a published iOS card game — I build interfaces that hold up under pressure.';

  readonly stats: Stat[] = [
    { num: '10+', label: 'Years experience' },
    { num: '5',  label: 'Companies' },
    { num: '2',  label: 'Live products' }
  ];

  readonly skills: SkillGroup[] = [
    {
      label: 'Frontend',
      items: ['Angular (v18)', 'TypeScript', 'React', 'JavaScript', 'RxJS', 'NgRx', 'AG Grid', 'HTML5 / CSS3', 'SASS', 'Bootstrap', 'Jasmine', 'NPM'],
      highlight: ['Angular (v18)', 'TypeScript', 'RxJS', 'AG Grid']
    },
    {
      label: 'Backend',
      items: ['Java', 'Spring Boot', 'Node.js', 'Express.js', 'Socket.IO', 'WebRTC'],
      highlight: ['Java', 'Spring Boot']
    },
    {
      label: 'Data & DevOps',
      items: ['Microsoft SQL', 'MongoDB', 'AWS', 'Linux', 'Jenkins', 'Shell Scripting', 'Capacitor / iOS']
    }
  ];

  readonly experience: ExperienceItem[] = [
    {
      role: 'Senior Application Developer',
      company: 'City of Austin Aviation',
      period: 'Dec 2024 – Present',
      location: 'Austin, Texas',
      current: true,
      bullets: [
        'Lead implementation, maintenance, and enhancement of enterprise applications supporting municipal operations.',
        'Design and develop SharePoint-based solutions for intranet portals, document management, and workflow automation.',
        'Drive cloud migration, security compliance, performance tuning, and stakeholder-aligned delivery using Agile methodology.'
      ]
    },
    {
      role: 'Angular BI Developer (Contract)',
      company: 'TD Bank',
      period: 'Sep 2024 – Nov 2024',
      location: 'Toronto, Ontario',
      bullets: [
        'Developed and optimized Angular reporting interfaces with AG Grid for banking analytics and data visualization.',
        'Built Java Spring Boot REST APIs to support UI workflows and reporting performance.',
        'Resolved live production issues and contributed to fraud detection product integration.'
      ]
    },
    {
      role: 'Freelance Software Developer',
      company: 'Independent Projects',
      period: 'Jul 2023 – Aug 2024',
      location: 'Remote',
      bullets: [
        'Built and deployed the Buddhist Society of Ontario website using MEAN stack on AWS.',
        'Designed, developed, and shipped International Bridge — a real-time multiplayer card game with video chat, published on the Apple App Store.'
      ]
    },
    {
      role: 'Front-End Software Engineer',
      company: 'Zonda Software',
      period: 'Apr 2022 – Jun 2023',
      location: 'Newport Beach, California',
      bullets: [
        'Built features for a map-based Angular real estate data platform serving business users.',
        'Translated business goals into Angular UI features; handled deployment, feedback, and bug resolution.'
      ]
    },
    {
      role: 'Full-Stack Engineer → UI Development Lead',
      company: 'Royal Bank of Canada',
      period: 'Dec 2017 – Apr 2022',
      location: 'Toronto, Ontario',
      bullets: [
        'Built enterprise Angular applications for risk analysis, monitoring, and reporting at one of Canada\'s largest banks.',
        'Led backend Java Spring Boot development, mentored junior engineers, and drove cloud migration to OpenShift.',
        'Introduced and owned AG Grid capabilities across the shared UI platform.'
      ]
    }
  ];

  readonly projects: ProjectItem[] = [
    {
      title: 'International Bridge',
      tag: 'iOS App · Multiplayer Game',
      description: 'A full-featured online multiplayer card game for International Bridge. Real-time game state synchronization, in-game video chat, and a polished Angular UI — packaged for iOS with Capacitor and published to the Apple App Store.',
      stack: ['Angular', 'Node.js', 'Socket.IO', 'WebRTC', 'Capacitor', 'iOS'],
      href: 'https://apps.apple.com/us/app/international-bridge/id6769182954',
      featured: true,
      iosBadge: true
    },
    {
      title: 'Buddhist Society of Ontario',
      tag: 'Web App · Non-Profit',
      description: 'A production-grade public website for the Buddhist Society of Ontario. Frontend in Angular, Express/MongoDB backend, fully deployed on AWS.',
      stack: ['Angular', 'Node.js', 'Express', 'MongoDB', 'AWS'],
      href: 'https://www.bso-toronto.ca'
    }
  ];

  readonly education: EducationItem[] = [
    {
      degree: 'M.Sc. in Electrical & Computer Engineering',
      school: 'The University of Texas at San Antonio',
      location: 'United States',
      initial: 'M'
    },
    {
      degree: 'B.Sc. in Electrical & Electronics Engineering',
      school: 'Bangladesh University of Engineering and Technology',
      location: 'Bangladesh',
      initial: 'B'
    }
  ];

  readonly contactItems: ContactItem[] = [
    { label: 'Email',    value: 'chapalbuet@yahoo.com',          href: 'mailto:chapalbuet@yahoo.com' },
    { label: 'Phone',    value: '512-289-5594',                   href: 'tel:+15122895594' },
    { label: 'Location', value: 'Austin, Texas, USA' },
    { label: 'LinkedIn', value: 'linkedin.com/in/chapal-barua',   href: 'https://www.linkedin.com/in/chapal-barua/', external: true },
    { label: 'App Store',value: 'International Bridge — iOS ↗',   href: 'https://apps.apple.com/us/app/international-bridge/id6769182954', external: true }
  ];

  scrollTo(id: string): void {
    const el = this.document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private cursorX = 0;
  private cursorY = 0;
  private ringX = 0;
  private ringY = 0;
  private animFrame?: number;
  private mouseMoveHandler?: (e: MouseEvent) => void;
  private observer?: IntersectionObserver;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

  ngOnInit(): void {
    this.document.body.classList.add('profile-route');
    this.initCursor();
    this.initScrollReveal();
  }

  ngOnDestroy(): void {
    this.document.body.classList.remove('profile-route');
    if (this.mouseMoveHandler) {
      this.document.removeEventListener('mousemove', this.mouseMoveHandler);
    }
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    if (this.observer) this.observer.disconnect();
  }

  private initCursor(): void {
    const cursor = this.document.getElementById('cb-cursor');
    const ring = this.document.getElementById('cb-cursor-ring');
    if (!cursor || !ring) return;

    this.mouseMoveHandler = (e: MouseEvent) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
    };
    this.document.addEventListener('mousemove', this.mouseMoveHandler);

    const animate = () => {
      cursor.style.left = this.cursorX + 'px';
      cursor.style.top  = this.cursorY + 'px';
      this.ringX += (this.cursorX - this.ringX) * 0.12;
      this.ringY += (this.cursorY - this.ringY) * 0.12;
      ring.style.left = this.ringX + 'px';
      ring.style.top  = this.ringY + 'px';
      this.animFrame = requestAnimationFrame(animate);
    };
    this.animFrame = requestAnimationFrame(animate);

    this.document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.style.width  = '18px';
        cursor.style.height = '18px';
        ring.style.width    = '56px';
        ring.style.height   = '56px';
      });
      el.addEventListener('mouseleave', () => {
        cursor.style.width  = '10px';
        cursor.style.height = '10px';
        ring.style.width    = '36px';
        ring.style.height   = '36px';
      });
    });
  }

  private initScrollReveal(): void {
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          this.observer!.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    // Use setTimeout to let Angular render first
    setTimeout(() => {
      this.document.querySelectorAll('.cb-reveal').forEach(el => {
        this.observer!.observe(el);
      });
    }, 100);
  }
}
