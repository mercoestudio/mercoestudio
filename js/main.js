(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.getElementById('primary-nav');
  const toggle = document.querySelector('.menu-toggle');

  // Mobile nav toggle
  if (nav && toggle) {
    const closeMenu = () => {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-active');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      document.body.classList.remove('nav-open');
    };

    const toggleMenu = () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-active', isOpen);
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      toggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      document.body.classList.toggle('nav-open', isOpen);
    };

    toggle.addEventListener('click', toggleMenu);

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  // Reveal on scroll (start only after first scroll)
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  if (revealEls.length) {
    if (prefersReducedMotion) {
      revealEls.forEach((el) => el.classList.add('is-visible'));
    } else {
      const startObserving = () => {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.dataset.delay || '0';
                el.style.setProperty('--reveal-delay', `${delay}ms`);
                el.classList.add('is-visible');
                observer.unobserve(el);
              }
            });
          },
          { threshold: 0.25 }
        );

        revealEls.forEach((el) => observer.observe(el));
      };

      window.addEventListener('scroll', startObserving, { once: true, passive: true });
    }
  }

  // Services tabs
  const tabLists = Array.from(document.querySelectorAll('[data-tabs]'));
  tabLists.forEach((tabList) => {
    const tabs = Array.from(tabList.querySelectorAll('[data-tab-target]'));
    const section = tabList.closest('.services');
    const panels = section ? Array.from(section.querySelectorAll('.services-panel')) : [];
    const panelsWrap = section ? section.querySelector('.services-panels') : null;
    const rotationMs = 7000;
    const minAutoWidth = 750;
    let activeIndex = Math.max(0, tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'));
    let timerId = null;
    let isPaused = false;
    let autoEnabled = !prefersReducedMotion && window.innerWidth >= minAutoWidth;

    tabs.forEach((tab) => {
      const isActive = tab.getAttribute('aria-selected') === 'true';
      tab.setAttribute('tabindex', isActive ? '0' : '-1');
    });

    const setActiveTab = (activeTab) => {
      const targetId = activeTab.dataset.tabTarget;
      const targetPanel = section ? section.querySelector(`#${targetId}`) : null;
      activeIndex = tabs.indexOf(activeTab);

      tabs.forEach((tab) => {
        tab.classList.remove('is-active');
        tab.classList.remove('is-animating');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      });

      panels.forEach((panel) => {
        panel.classList.remove('is-active');
        panel.hidden = true;
      });

      activeTab.classList.add('is-active');
      if (autoEnabled) {
        // restart progress animation
        void activeTab.offsetWidth;
        activeTab.classList.add('is-animating');
      }
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.setAttribute('tabindex', '0');

      if (targetPanel) {
        targetPanel.classList.add('is-active');
        targetPanel.hidden = false;
        targetPanel.classList.add('is-visible');
      }
    };

    const setPanelsMinHeight = () => {
      if (!panelsWrap || panels.length === 0) {
        return;
      }
      let maxHeight = 0;
      panels.forEach((panel) => {
        const clone = panel.cloneNode(true);
        clone.hidden = false;
        clone.style.position = 'absolute';
        clone.style.visibility = 'hidden';
        clone.style.pointerEvents = 'none';
        clone.style.height = 'auto';
        clone.style.display = 'block';
        clone.style.width = '100%';
        panelsWrap.appendChild(clone);
        maxHeight = Math.max(maxHeight, clone.offsetHeight);
        panelsWrap.removeChild(clone);
      });
      panelsWrap.style.minHeight = `${maxHeight}px`;
    };

    const startRotation = () => {
      if (!autoEnabled) {
        return;
      }
      if (timerId) {
        clearInterval(timerId);
      }
      timerId = setInterval(() => {
        if (isPaused || tabs.length < 2) {
          return;
        }
        const nextIndex = (activeIndex + 1) % tabs.length;
        setActiveTab(tabs[nextIndex]);
      }, rotationMs);
    };

    const pauseRotation = () => {
      isPaused = true;
      if (section) {
        section.classList.add('is-paused');
      }
    };

    const resumeRotation = () => {
      isPaused = false;
      if (section) {
        section.classList.remove('is-paused');
      }
    };

    setActiveTab(tabs[activeIndex]);
    setPanelsMinHeight();
    startRotation();

    const updateAutoRotation = () => {
      const shouldEnable = !prefersReducedMotion && window.innerWidth >= minAutoWidth;
      if (shouldEnable === autoEnabled) {
        return;
      }
      autoEnabled = shouldEnable;
      if (!autoEnabled) {
        if (timerId) {
          clearInterval(timerId);
          timerId = null;
        }
        tabs.forEach((tab) => tab.classList.remove('is-animating'));
      } else {
        setActiveTab(tabs[activeIndex]);
        startRotation();
      }
    };

    panels.forEach((panel) => {
      panel.addEventListener('mouseenter', pauseRotation);
      panel.addEventListener('mouseleave', resumeRotation);
      panel.addEventListener('focusin', pauseRotation);
      panel.addEventListener('focusout', resumeRotation);
    });

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        setActiveTab(tab);
        startRotation();
      });
      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') {
          return;
        }

        event.preventDefault();
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (index + direction + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        setActiveTab(tabs[nextIndex]);
        startRotation();
      });
    });

    window.addEventListener('resize', () => {
      updateAutoRotation();
      setPanelsMinHeight();
    });
  });

  // Process steps
  const processGroups = Array.from(document.querySelectorAll('[data-process]'));
  processGroups.forEach((group) => {
    const processSection = group.closest('.process');
    const steps = Array.from(group.querySelectorAll('.process-step'));
    const shot = processSection ? processSection.querySelector('.process-shot') : null;
    const media = processSection ? processSection.querySelector('.process-media') : null;
    const stepDuration = 10000;
    let currentIndex = 0;
    let timerId = null;
    let isPaused = false;

    if (steps.length === 0) {
      return;
    }

    const syncHeights = () => {
      if (!media) {
        return;
      }
      if (window.innerWidth <= 900) {
        media.style.height = '';
        return;
      }
      const height = group.getBoundingClientRect().height;
      if (height) {
        media.style.height = `${height}px`;
      }
    };

    const setActiveStep = (step) => {
      currentIndex = steps.indexOf(step);
      steps.forEach((item) => {
        const isActive = item === step;
        item.classList.toggle('is-active', isActive);
        item.classList.remove('is-animating');
        item.classList.remove('is-paused');
        const toggle = item.querySelector('.process-toggle');
        if (toggle) {
          toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }
      });

      step.classList.add('is-animating');

      if (shot) {
        const nextSrc = step.dataset.image;
        const nextAlt = step.querySelector('.process-step-title')?.textContent?.trim();
        if (nextSrc && shot.getAttribute('src') !== nextSrc) {
          shot.classList.remove('is-entering');
          shot.classList.add('is-swapping');
          const preloader = new Image();
          preloader.src = nextSrc;
          preloader.onload = () => {
            shot.src = nextSrc;
            if (nextAlt) {
              shot.alt = nextAlt;
            }
            requestAnimationFrame(() => {
              shot.classList.remove('is-swapping');
              shot.classList.add('is-entering');
            });
          };
        }
      }

      requestAnimationFrame(syncHeights);
    };

    const startAuto = () => {
      if (timerId) {
        clearInterval(timerId);
      }
      timerId = setInterval(() => {
        if (isPaused) {
          return;
        }
        currentIndex = (currentIndex + 1) % steps.length;
        setActiveStep(steps[currentIndex]);
      }, stepDuration);
    };

    const pauseAuto = () => {
      isPaused = true;
      const activeStep = group.querySelector('.process-step.is-active');
      if (activeStep) {
        activeStep.classList.add('is-paused');
      }
    };

    const resumeAuto = () => {
      isPaused = false;
      const activeStep = group.querySelector('.process-step.is-active');
      if (activeStep) {
        activeStep.classList.remove('is-paused');
      }
    };

    const setStepsMinHeight = () => {
      if (!group || steps.length === 0) {
        return;
      }
      const clone = group.cloneNode(true);
      clone.style.position = 'absolute';
      clone.style.visibility = 'hidden';
      clone.style.pointerEvents = 'none';
      clone.style.height = 'auto';
      clone.style.width = `${group.clientWidth}px`;
      const parent = group.parentElement || group;
      parent.appendChild(clone);

      let maxHeight = 0;
      const cloneSteps = Array.from(clone.querySelectorAll('.process-step'));
      cloneSteps.forEach((cloneStep, index) => {
        cloneSteps.forEach((item, idx) => {
          item.classList.toggle('is-active', idx === index);
        });
        maxHeight = Math.max(maxHeight, clone.offsetHeight);
      });

      parent.removeChild(clone);
      group.style.minHeight = `${maxHeight}px`;
      group.style.height = `${maxHeight}px`;
      syncHeights();
    };

    steps.forEach((step) => {
      const toggle = step.querySelector('.process-toggle');
      if (!toggle) {
        return;
      }
      toggle.addEventListener('click', () => {
        setActiveStep(step);
        if (!prefersReducedMotion) {
          startAuto();
        }
      });
    });

    const initial = steps[0];
    currentIndex = 0;
    setActiveStep(initial);
    setStepsMinHeight();
    if (!prefersReducedMotion) {
      startAuto();
    }

    window.addEventListener('resize', () => {
      setStepsMinHeight();
    });

    window.addEventListener('load', () => {
      setStepsMinHeight();
    });

    steps.forEach((step) => {
      step.addEventListener('mouseenter', () => {
        if (step.classList.contains('is-active')) {
          pauseAuto();
        }
      });
      step.addEventListener('mouseleave', () => {
        if (step.classList.contains('is-active')) {
          resumeAuto();
        }
      });
      step.addEventListener('focusin', () => {
        if (step.classList.contains('is-active')) {
          pauseAuto();
        }
      });
      step.addEventListener('focusout', () => {
        if (step.classList.contains('is-active')) {
          resumeAuto();
        }
      });
    });
  });

  // Before/after compare
  const compareWidgets = Array.from(document.querySelectorAll('[data-compare]'));
  compareWidgets.forEach((widget) => {
    const range = widget.querySelector('.compare-range');
    if (!range) {
      return;
    }

    const setPosition = (value) => {
      const clamped = Math.min(100, Math.max(0, Number(value)));
      widget.style.setProperty('--compare', `${clamped}%`);
    };

    setPosition(range.value);
    range.addEventListener('input', (event) => {
      setPosition(event.target.value);
    });
  });

  // FAQ accordion
  const faqLists = Array.from(document.querySelectorAll('[data-faq]'));
  faqLists.forEach((list) => {
    const items = Array.from(list.querySelectorAll('.faq-item'));
    if (items.length === 0) {
      return;
    }

    const setActive = (item) => {
      items.forEach((entry) => {
        const isActive = entry === item;
        entry.classList.toggle('is-active', isActive);
        const toggle = entry.querySelector('.faq-toggle');
        const panel = entry.querySelector('.faq-panel');
        if (toggle) {
          toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        }
        if (panel) {
          panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        }
      });
    };

    items.forEach((item) => {
      const toggle = item.querySelector('.faq-toggle');
      if (!toggle) {
        return;
      }
      toggle.addEventListener('click', () => {
        if (item.classList.contains('is-active')) {
          item.classList.remove('is-active');
          toggle.setAttribute('aria-expanded', 'false');
          const panel = item.querySelector('.faq-panel');
          if (panel) {
            panel.setAttribute('aria-hidden', 'true');
          }
        } else {
          setActive(item);
        }
      });
    });

    const initial = items.find((item) => item.classList.contains('is-active')) || items[0];
    setActive(initial);
  });
})();
