import { PageHeader, Notice, StatusBadge, Reveal } from '../components/ui';
import Tex from '../components/Tex';

interface Block {
  id: string; title: string; eqs: string[]; meaning: string[];
  site: boolean; // implemented in this website's illustrative simulator
}

const BLOCKS: Block[] = [
  {
    id: 'model', title: '1. Generalized physical measurement model', site: true,
    eqs: ['y_k = F(x;\\,\\theta_k) + b_k + \\varepsilon_k,\\qquad \\varepsilon_k \\sim \\mathcal{N}(0,\\Sigma_k)'],
    meaning: [
      'The k-th observation y_k depends on the physical state x (for example aerosol optical depth, surface reflectance, moisture) through a forward model F, such as a radiative transfer model.',
      'θ_k is the measurement configuration chosen by the system: spectral band, modality, viewing geometry. Choosing θ is the decision AURORA studies.',
      'b_k is systematic error such as calibration drift, and ε_k is random noise with covariance Σ_k. The simulator uses a linear F and treats b_k as unmodelled drift.',
    ],
  },
  {
    id: 'inverse', title: '2. Inverse problem formulation', site: false,
    eqs: [
      '\\hat{x} = \\arg\\min_x\\; \\big\\| y - F(x;\\theta) \\big\\|^2_{\\Sigma^{-1}} + \\big\\| x - x_a \\big\\|^2_{S_a^{-1}}',
      'K = \\frac{\\partial F}{\\partial x}\\Big|_{\\hat x}',
    ],
    meaning: [
      'Retrieval inverts the forward model: find the state that best explains the data, regularized by prior knowledge x_a with covariance S_a (the optimal-estimation form common in atmospheric retrieval).',
      'The Jacobian K says how each observation responds to each state component. If columns of K are nearly parallel—as for aerosol loading and surface albedo at one wavelength—the problem is ill-conditioned and the solution is ambiguous.',
    ],
  },
  {
    id: 'bayes', title: '3. Bayesian state estimation', site: true,
    eqs: ['p(x \\mid \\mathcal{D}_k) \\;\\propto\\; p(y_k \\mid x, \\theta_k)\\; p(x \\mid \\mathcal{D}_{k-1}), \\qquad \\mathcal{D}_k = \\{(\\theta_i, y_i)\\}_{i\\le k}'],
    meaning: [
      'Knowledge about the state is a probability distribution, updated after every observation. The posterior after k observations becomes the prior for the next decision.',
      'For linear models with Gaussian noise this recursion is the Kalman filter, which the site simulator uses.',
    ],
  },
  {
    id: 'posterior', title: '4. Posterior uncertainty', site: true,
    eqs: [
      'P_k = \\big( P_{k-1}^{-1} + K_k^{\\top} \\Sigma_k^{-1} K_k \\big)^{-1}',
      'A_k = I - P_k P_0^{-1}, \\qquad d_s = \\operatorname{tr}(A_k)',
    ],
    meaning: [
      'In the linear-Gaussian case the posterior covariance P_k shrinks by the information each observation contributes. Its diagonal gives per-parameter uncertainty.',
      'The averaging kernel A_k shows how much of the retrieved state comes from the data rather than the prior; its trace d_s is the number of independent pieces of information (degrees of freedom for signal) recovered so far.',
      'Posterior uncertainty is only as trustworthy as the model: unmodelled drift can make P_k small while the actual error stays large (try the drift slider in the simulator).',
    ],
  },
  {
    id: 'eig', title: '5. Expected information gain', site: true,
    eqs: [
      'U(\\theta) = I(x;\\, y \\mid \\theta, \\mathcal{D}_k) = \\mathbb{E}_{y\\mid\\theta,\\mathcal{D}_k}\\Big[ D_{\\mathrm{KL}}\\big(p(x\\mid y,\\theta,\\mathcal{D}_k)\\,\\|\\,p(x\\mid\\mathcal{D}_k)\\big) \\Big]',
      'U_{\\text{lin-Gauss}}(\\theta) = \\tfrac{1}{2}\\log\\det\\!\\big( I + \\Sigma_\\theta^{-1} K_\\theta P_k K_\\theta^{\\top} \\big)',
    ],
    meaning: [
      'The value of a candidate observation is how much it is expected to reduce uncertainty about x, measured as mutual information (Lindley, 1956). It can be evaluated before the observation is made.',
      'In the linear-Gaussian case it has a closed form: an observation is valuable when it is sensitive (large K) in directions where the current uncertainty P_k is large, relative to its noise.',
    ],
  },
  {
    id: 'budget', title: '6. Resource-constrained measurement selection', site: true,
    eqs: [
      '\\max_{\\theta_1,\\dots,\\theta_n}\\; I(x;\\, y_{1:n}) \\quad \\text{s.t.}\\quad \\sum_{i=1}^{n} c(\\theta_i) \\le B',
      '\\theta_{k+1} = \\arg\\max_{\\theta:\\, c(\\theta)\\le B_k} \\frac{U(\\theta)}{c(\\theta)}',
    ],
    meaning: [
      'Every observation has a cost c(θ)—time, energy, data volume—and the total budget B is finite. The goal is the most informative affordable sequence.',
      'Exact sequential optimization is generally intractable, so a common approximation is greedy selection of the best information gain per unit cost. Greedy choices are myopic and can be beaten by well-designed fixed plans; AURORA treats this as an empirical question.',
    ],
  },
  {
    id: 'subset', title: '7. Spectral subset optimization', site: false,
    eqs: [
      'S^{\\star} = \\arg\\max_{S \\subset \\Lambda,\\; |S| = 5}\\; \\tfrac{1}{2}\\log\\det\\!\\big( I + \\Sigma_S^{-1} K_S\\, P_0\\, K_S^{\\top} \\big)',
    ],
    meaning: [
      'Choosing five channels from a candidate set Λ is a combinatorial set-selection problem. The objective here is the information the five channels jointly carry about the state, which penalizes redundant (correlated) channels automatically.',
      'When measurement noise is independent across channels, this objective is monotone submodular, so greedy selection carries a (1 − 1/e) approximation guarantee for cardinality constraints (Krause et al., 2008).',
      'Because K_S and P_0 depend on the state and the conditions, S* is expected to change with them—the hypothesis behind adaptive five-band selection. The toy spectral explorer on this site uses a simpler heuristic, not this objective.',
    ],
  },
  {
    id: 'sufficiency', title: '8. Observational sufficiency', site: false,
    eqs: [
      '\\text{sufficient}(\\mathcal{D}_k) \\iff \\sqrt{[P_k]_{ii}} \\le \\epsilon_i \\;\\; \\forall\\, i \\in \\mathcal{Q}',
      'r_k = (y_k - \\hat{y}_k)^{\\top} S_k^{-1} (y_k - \\hat{y}_k) > \\chi^2_{m,\\,1-\\alpha} \\;\\Rightarrow\\; \\text{flag unknown condition}',
    ],
    meaning: [
      'A set of observations is sufficient for a question when every quantity of interest (the set Q) is constrained to the required precision ε_i. Other state components may remain unresolved without harm.',
      'Sufficiency is only meaningful if the model is adequate. A consistency check on the innovation r_k (with predicted covariance S_k) can flag observations the model cannot explain—one way to formalize detection of unknown conditions such as drift or precipitation.',
    ],
  },
  {
    id: 'stopping', title: '9. Adaptive stopping criteria', site: true,
    eqs: ['\\text{stop at } k \\iff \\text{sufficient}(\\mathcal{D}_k) \\;\\lor\\; \\max_{\\theta} \\frac{U(\\theta)}{c(\\theta)} < \\lambda \\;\\lor\\; B_k < \\min_\\theta c(\\theta)'],
    meaning: [
      'The loop ends when the question is answered, when no remaining observation is worth its cost (λ is the value of information per unit cost below which measuring stops), or when nothing affordable remains.',
      'The site simulator implements the first and last conditions with an uncertainty threshold on the RMS posterior standard deviation.',
    ],
  },
];

export default function Mathematics() {
  return (
    <>
      <PageHeader eyebrow="Mathematical framework" title="Measurement as a sequence of decisions">
        <p>This page sets out the mathematical formulation behind AURORA: a measurement model, the inverse problem, Bayesian updating, the value of a candidate observation, and when to stop. The notation follows standard optimal-estimation and Bayesian experimental design literature.</p>
      </PageHeader>
      <section className="section space-y-6">
        <Notice kind="caution" title="Proposed formulations versus implemented algorithms">
          All formulations below are <b>proposed</b> as the framework for AURORA. Each block states whether its simplest (linear-Gaussian) form is implemented in this website's illustrative simulator. Which of them are implemented in AURORA's own computational experiments is to be confirmed by the researcher and is not asserted here.
        </Notice>
        <div className="panel panel-pad overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Component</th><th>Formulation</th><th>Site simulator (illustrative)</th><th>AURORA experiments</th></tr></thead>
            <tbody>
              {BLOCKS.map((b) => (
                <tr key={b.id}>
                  <td><a href={`#/mathematics`} onClick={(e) => { e.preventDefault(); document.getElementById(b.id)?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-aurora-cyan">{b.title.replace(/^\d+\.\s*/, '')}</a></td>
                  <td><StatusBadge status="proposed" /></td>
                  <td>{b.site ? <StatusBadge status="implemented-site" /> : <span className="text-xs text-slate-500">not implemented</span>}</td>
                  <td><span className="text-xs text-slate-500">to be confirmed</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="section space-y-6 pt-0">
        {BLOCKS.map((b) => (
          <Reveal key={b.id}>
            <article id={b.id} className="panel panel-pad scroll-mt-24">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="h-display text-2xl md:text-3xl">{b.title}</h2>
                <div className="flex gap-2"><StatusBadge status="proposed" />{b.site && <StatusBadge status="implemented-site" />}</div>
              </div>
              <div className="my-5 space-y-2 rounded-xl border border-white/5 bg-void/50 px-4 py-3">
                {b.eqs.map((e, i) => <Tex key={i} display>{e}</Tex>)}
              </div>
              <h3 className="eyebrow mb-2">Physical meaning</h3>
              <div className="prose-sci text-sm">{b.meaning.map((m, i) => <p key={i}>{m}</p>)}</div>
            </article>
          </Reveal>
        ))}
      </section>
    </>
  );
}
